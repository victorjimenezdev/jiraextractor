# Checklist Extraction Issue Summary

## Problem
The Jira ticket extractor Chrome extension is not successfully extracting checklist/todo list items from Jira tickets. The `checklists` array in the extracted JSON is always empty (`[]`), even when checklists are visible on the page.

## Context
- **Extension**: Chrome extension for extracting Jira tickets to JSON format
- **Technology**: Manifest V3, Content Scripts, JavaScript
- **Current Status**: All other features work (title, description, comments, attachments), but checklists are not being extracted

## Expected Output
The JSON should include a `checklists` array like this:
```json
{
  "checklists": [
    {
      "id": 1,
      "title": "Checklist",
      "progress": {
        "completed": 0,
        "total": 8,
        "percentage": 0
      },
      "items": [
        {
          "id": "69271e495b243b361879d69a",
          "text": "Review the conflict with Bolivar's work",
          "checked": false,
          "checkedBy": "Staci Jansma",
          "checkedAt": "26 Nov 2025 10:35"
        },
        ...
      ]
    }
  ]
}
```

## HTML Structure (from user's example)
Based on the HTML snippet provided, the checklist structure appears to be:

```html
<div class="issue-panel panel-position-left desktop">
  <div>
    <header id="header">
      <div class="bar">
        <div class="bar-progress">
          <div class="bar-progress-badge">
            <span data-testid="completion-badge" aria-label="0%">
              <span class="css-c29v3k">
                <span class="css-gjbov2">0 / 8</span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </header>
    <section id="main" class="aui-page-panel-inner">
      <div class="aui-group">
        <div class="aui-item">
          <ul class="item-details todo-list todo-list-sortable-group ui-sortable">
            <li class="statuses-disabled todo-item" 
                data-id="69271e495b243b361879d69a" 
                data-checklist-id="default-checklist">
              <div class="todo-item-inner draggable ui-sortable-handle">
                <div class="view" title="Unchecked by Staci Jansma on 26 Nov 2025 10:35">
                  <div class="todo-item-checkbox" data-testid="item-checkbox-69271e495b243b361879d69a">
                    <label>
                      <input type="checkbox" aria-checked="false">
                    </label>
                  </div>
                  <div class="todo-item-text-container">
                    <span class="item-content">
                      <span class="todo-item-token-text">Review the conflict with Bolivar's work</span>
                    </span>
                  </div>
                </div>
              </div>
            </li>
            <!-- More items... -->
          </ul>
        </div>
      </div>
    </section>
  </div>
</div>
```

## Current Implementation
The current `extractChecklists()` function:

1. **Searches for panels**: `.issue-panel`, `[class*="checklist"]`, `[data-testid*="checklist"]`
2. **Finds todo lists**: `.todo-list`, `ul.item-details`, `ul[class*="todo-list"]`
3. **Extracts items**: `.todo-item`, `li[class*="todo-item"]`, `li[data-id]`
4. **Gets text**: Multiple selectors including `.item-content`, `.todo-item-token-text`
5. **Gets progress**: `[data-testid="completion-badge"]`
6. **Gets checkbox state**: `input[type="checkbox"]`
7. **Gets metadata**: From `title` attribute on `.view` element

## What We've Tried

1. **Multiple selector strategies**: Tried various combinations of class selectors
2. **Fallback searches**: Added fallback to search for todo items directly if panels aren't found
3. **Virtual panels**: Created virtual panel objects when todo lists are found without panels
4. **Broader searches**: Expanded search to include `.panel-position-left`, `.panel-position-right`
5. **Direct item search**: Added fallback to find `li[class*="todo-item"]` anywhere on page

## Test Case
- **Ticket**: CUHC001QA-77
- **URL**: https://eastern-standard.atlassian.net/browse/CUHC001QA-77
- **Result**: `"checklists": []` (empty array)
- **Expected**: Should contain 8 checklist items with progress "0 / 8"

## Possible Issues

1. **Timing**: Checklists might be loaded dynamically after the content script runs
2. **Selector mismatch**: The actual DOM structure might differ from what we're searching for
3. **Shadow DOM**: Checklists might be in shadow DOM (unlikely but possible)
4. **React/Virtual DOM**: Jira uses React, so the structure might be different than the HTML source
5. **Hidden/Filtered**: Items might be hidden or filtered (e.g., "Hide completed items" is enabled)

## Debugging Suggestions

1. **Console logging**: Add `console.log` statements to see what selectors are finding
2. **DOM inspection**: Use browser DevTools to inspect the actual DOM structure when the page is loaded
3. **Timing delays**: Add delays or wait for specific elements before extraction
4. **Event listeners**: Wait for checklist-specific events or mutations
5. **Test selectors**: Test each selector individually in the browser console

## Files Involved

- **Main extraction logic**: `/Users/vj/Documents/work/personal/jiraextractor/extractor.js`
  - Function: `extractChecklists()` (lines ~146-242)
  - Called from: `extractTicket()` (line ~1025)
  - Included in: `ticketData` object (line ~1135)

- **Saved HTML page**: `/Users/vj/Documents/work/personal/jirapage/[CUHC001QA-77] .org _ NEW REQUEST_ Office List Component - Jira.html`
  - Note: The saved HTML might not contain the checklist if it was loaded dynamically

## Next Steps

1. **Inspect live DOM**: Open the Jira ticket in browser, inspect the checklist elements, and note the exact selectors
2. **Add timing**: Wait for checklist to load before extraction
3. **Test selectors**: Create a test script to verify each selector works
4. **Check for React**: If using React DevTools, inspect the component structure
5. **MutationObserver**: Use MutationObserver to detect when checklists are added to DOM

## Code Location
The checklist extraction function is in:
`/Users/vj/Documents/work/personal/jiraextractor/extractor.js`
Starting at line 146: `function extractChecklists()`

