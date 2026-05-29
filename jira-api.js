// Jira API utility functions for REST API v3
// Uses Basic Authentication with email and API token

if (typeof JiraAPI === 'undefined') {
  class JiraAPI {
    constructor(email, apiToken, baseUrl) {
      this.email = email;
      this.apiToken = apiToken;
      this.baseUrl = baseUrl;

      // Create base64 encoded credentials for Basic Auth
      const credentials = `${email}:${apiToken}`;
      this.authHeader = `Basic ${btoa(credentials)}`;
    }

    // Make API request
    async request(endpoint, options = {}) {
      const url = `${this.baseUrl}/rest/api/3${endpoint}`;

      const defaultOptions = {
        headers: {
          'Authorization': this.authHeader,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      };

      try {
        const response = await fetch(url, defaultOptions);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Jira API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return await response.json();
      } catch (error) {
        throw new Error(`Jira API request failed: ${error.message}`);
      }
    }

    // Get ticket by key (e.g., "PROJ-123")
    async getIssue(issueKey, fields = null) {
      // Default fields to fetch - usage of *all ensures we get custom fields
      // We also need "names" expansion to map customfield_XXXX to readable names
      const queryParams = {
        expand: 'renderedFields,names',
        fields: fields || ['*all']
      };

      const queryString = Object.entries(queryParams)
        .map(([key, val]) => `${key}=${encodeURIComponent(Array.isArray(val) ? val.join(',') : val)}`)
        .join('&');

      return this.request(`/issue/${issueKey}?${queryString}`);
    }

    // Get comments for an issue
    async getComments(issueKey) {
      const data = await this.request(`/issue/${issueKey}/comment?expand=renderedBody`);
      return data.comments || [];
    }

    // Get attachments for an issue
    async getAttachments(issueKey) {
      const issue = await this.getIssue(issueKey, ['attachment']);
      return issue.fields?.attachment || [];
    }

    // Get full ticket data including all fields
    async getFullTicket(issueKey) {
      const issue = await this.getIssue(issueKey);
      const comments = await this.getComments(issueKey);

      // Extract all custom fields that have values
      const customFields = [];
      if (issue.names && issue.fields) {
        Object.keys(issue.names).forEach(key => {
          // Check if it's a custom field (starts with customfield_)
          if (key.startsWith('customfield_')) {
            const value = issue.renderedFields?.[key] || issue.fields[key];

            // Only include if it has a value
            if (value !== null && value !== undefined && value !== '') {
              // Filter out empty complex objects
              if (typeof value === 'object' && Object.keys(value).length === 0) return;

              customFields.push({
                id: key,
                name: issue.names[key],
                value: value,
                // Keep original raw value if needed, but rendered is usually better for display
                originalValue: issue.fields[key]
              });
            }
          }
        });
      }

      // Process attachments
      const attachments = (issue.fields.attachment || []).map(att => ({
        id: att.id, // This is the attachment ID (e.g., "78403")
        filename: att.filename,
        size: att.size,
        mimeType: att.mimeType,
        content: att.content, // API endpoint URL
        thumbnail: att.thumbnail
      }));

      return {
        key: issue.key,
        id: issue.id,
        self: issue.self,
        summary: issue.fields.summary,
        description: issue.fields.description,
        renderedDescription: issue.renderedFields?.description || '',
        status: issue.fields.status?.name || '',
        assignee: issue.fields.assignee ? {
          name: issue.fields.assignee.displayName,
          email: issue.fields.assignee.emailAddress,
          avatar: issue.fields.assignee.avatarUrls?.['48x48']
        } : null,
        reporter: issue.fields.reporter ? {
          name: issue.fields.reporter.displayName,
          email: issue.fields.reporter.emailAddress,
          avatar: issue.fields.reporter.avatarUrls?.['48x48']
        } : null,
        created: issue.fields.created,
        updated: issue.fields.updated,
        project: issue.fields.project?.name || '',
        issueType: issue.fields.issuetype?.name || '',
        priority: issue.fields.priority?.name || '',
        attachments: attachments,
        comments: comments.map(comment => ({
          id: comment.id,
          author: comment.author?.displayName,
          authorEmail: comment.author?.emailAddress,
          body: comment.renderedBody || comment.body, // Use rendered body for comments too if available
          created: comment.created,
          updated: comment.updated
        })),
        // specific QA bugs field kept for backward compatibility if needed, 
        // but it will also be in customFields now
        qaBugs: issue.renderedFields?.customfield_10207 || '',
        customFields: customFields
      };
    }

    // Helper to extract base URL from Jira page URL
    static extractBaseUrl(url) {
      try {
        const urlObj = new URL(url);
        return `${urlObj.protocol}//${urlObj.hostname}`;
      } catch (error) {
        return null;
      }
    }

    // Helper to extract issue key from URL
    static extractIssueKey(url) {
      const browseMatch = url.match(/\/browse\/([A-Z]+-\d+)/i);
      if (browseMatch && browseMatch[1]) {
        return browseMatch[1];
      }
      const pathMatch = url.match(/([A-Z]{2,}\d+-\d+)/i);
      return pathMatch ? pathMatch[1] : null;
    }
  }

  // Attach to window to ensure global availability
  window.JiraAPI = JiraAPI;
}

// Helper function to clean HTML from Jira's rendered content
function cleanJiraHtml(html) {
  if (!html) return '';

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Remove script and style elements
  const scripts = tempDiv.querySelectorAll('script, style');
  scripts.forEach(el => el.remove());

  // Process strikethrough elements
  const strikethroughSelectors = [
    '[style*="line-through"]',
    '[style*="text-decoration: line-through"]',
    's',
    'strike',
    'del'
  ];

  strikethroughSelectors.forEach(selector => {
    const elements = tempDiv.querySelectorAll(selector);
    elements.forEach(el => {
      const text = el.textContent || el.innerText || '';
      if (text.trim()) {
        const marker = document.createElement('span');
        marker.setAttribute('data-strikethrough', 'true');
        marker.textContent = text.trim();
        el.replaceWith(marker);
      }
    });
  });

  // Extract text, converting strikethrough markers to <s> tags
  function extractTextWithStrikethrough(node) {
    let result = '';

    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        result += child.textContent;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.getAttribute('data-strikethrough') === 'true') {
          result += `<s>${child.textContent}</s>`;
        } else {
          result += extractTextWithStrikethrough(child);
        }
      }
    }
    return result;
  }

  let text = extractTextWithStrikethrough(tempDiv);

  // Clean up whitespace but preserve <s> tags
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

// Convert Jira API data to extractor format
function convertApiDataToExtractorFormat(apiData, baseUrl) {
  return {
    title: apiData.summary || '',
    ticketKey: apiData.key || '',
    url: `${baseUrl}/browse/${apiData.key}`,
    extractedAt: new Date().toISOString(),
    description: cleanJiraHtml(apiData.renderedDescription || apiData.description || ''),
    qaBugs: cleanJiraHtml(apiData.qaBugs || ''),
    customFields: (apiData.customFields || []).map(cf => ({
      key: cf.id,
      label: cf.name,
      value: typeof cf.value === 'string' ? cleanJiraHtml(cf.value) : cf.value,
      originalValue: cf.originalValue
    })),
    comments: (apiData.comments || []).map(comment => ({
      id: comment.id,
      author: comment.author || 'Unknown',
      timestamp: comment.created || '',
      body: cleanJiraHtml(comment.renderedBody || comment.body || '')
    })),
    checklists: [], // Checklists are not in standard API, need DOM extraction
    attachments: (apiData.attachments || []).map((att, idx) => {
      // Construct browser-session-compatible URL
      // API returns att.content which is /rest/api/3/attachment/content/ID
      // But for browser session, we need /secure/attachment/ID/filename
      // Use att.id directly (it's the attachment ID from the API)
      let url = att.content || '';
      const attachmentId = att.id || '';
      const filename = att.filename || `attachment-${attachmentId}`;

      // Always construct browser-session URL for better compatibility
      if (attachmentId) {
        url = `${baseUrl}/secure/attachment/${attachmentId}/${encodeURIComponent(filename)}`;
      } else if (url.includes('/rest/api/3/attachment/content/')) {
        // Fallback: extract ID from API URL if att.id is not available
        const idMatch = url.match(/\/attachment\/content\/(\d+)/);
        if (idMatch && idMatch[1]) {
          const extractedId = idMatch[1];
          url = `${baseUrl}/secure/attachment/${extractedId}/${encodeURIComponent(filename)}`;
        }
      }

      return {
        id: idx + 1,
        name: att.filename || `attachment-${idx + 1}`,
        url: url,
        size: att.size || 0,
        mimeType: att.mimeType || '',
        attachmentId: att.id, // Store original ID for reference
        apiUrl: att.content // Store original API URL for authenticated downloads
      };
    })
  };
}
