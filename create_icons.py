#!/usr/bin/env python3
"""
Simple script to create icon images for the Chrome extension
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, output_path):
    # Create a new image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw background circle (Jira blue: #0052CC)
    margin = size // 10
    draw.ellipse([margin, margin, size - margin, size - margin], 
                 fill=(0, 82, 204, 255), outline=None)
    
    # Draw ticket icon (simplified)
    # Draw a rectangle for ticket
    ticket_margin = size // 4
    ticket_width = size - 2 * ticket_margin
    ticket_height = size - 2 * ticket_margin
    
    # Main ticket body
    draw.rectangle([ticket_margin, ticket_margin, 
                   ticket_margin + ticket_width, 
                   ticket_margin + ticket_height],
                  fill=(255, 255, 255, 255), outline=None)
    
    # Draw perforated edge (dots)
    dot_size = 2
    dot_spacing = 4
    num_dots = ticket_height // dot_spacing
    for i in range(num_dots):
        y = ticket_margin + i * dot_spacing
        if y < ticket_margin + ticket_height:
            draw.ellipse([ticket_margin - dot_size, y - dot_size,
                         ticket_margin + dot_size, y + dot_size],
                        fill=(0, 82, 204, 255))
    
    # Draw lines on ticket (representing text)
    line_y = ticket_margin + ticket_height // 3
    line_width = ticket_width - 2 * (size // 8)
    draw.rectangle([ticket_margin + size // 8, line_y,
                   ticket_margin + size // 8 + line_width, line_y + 2],
                  fill=(200, 200, 200, 255))
    
    line_y2 = ticket_margin + ticket_height // 2
    draw.rectangle([ticket_margin + size // 8, line_y2,
                   ticket_margin + size // 8 + line_width * 0.7, line_y2 + 2],
                  fill=(200, 200, 200, 255))
    
    # Save the image
    img.save(output_path, 'PNG')
    print(f"Created {output_path} ({size}x{size})")

if __name__ == '__main__':
    os.makedirs('icons', exist_ok=True)
    
    sizes = [16, 48, 128]
    for size in sizes:
        create_icon(size, f'icons/icon{size}.png')

