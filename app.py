import re
import urllib.parse
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_release_notes():
    try:
        response = requests.get(FEED_URL, timeout=15)
        response.raise_for_status()
        
        # Parse XML
        root = ET.fromstring(response.content)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        parsed_entries = []
        
        for entry in root.findall('atom:entry', ns):
            date_str = entry.find('atom:title', ns).text.strip()
            link_el = entry.find('atom:link[@rel="alternate"]', ns)
            base_link = link_el.attrib['href'] if link_el is not None else ""
            updated = entry.find('atom:updated', ns).text.strip()
            
            content_el = entry.find('atom:content', ns)
            if content_el is None:
                continue
                
            content_html = content_el.text or ""
            soup = BeautifulSoup(content_html, 'html.parser')
            
            h3_tags = soup.find_all('h3')
            
            if not h3_tags:
                # Fallback if no category tags exist
                parsed_entries.append({
                    'date': date_str,
                    'type': 'General',
                    'content': content_html.strip(),
                    'link': base_link,
                    'updated': updated,
                    'text_content': soup.get_text().strip()
                })
                continue
            
            for h3 in h3_tags:
                note_type = h3.get_text().strip()
                
                # Gather content until next h3
                sibling_htmls = []
                sibling = h3.next_sibling
                while sibling and sibling.name != 'h3':
                    if sibling.name:
                        sibling_htmls.append(str(sibling))
                    elif isinstance(sibling, str):
                        sibling_htmls.append(sibling)
                    sibling = sibling.next_sibling
                
                note_content = "".join(sibling_htmls).strip()
                note_soup = BeautifulSoup(note_content, 'html.parser')
                text_content = note_soup.get_text().strip()
                
                # Create a specific anchor link
                type_slug = re.sub(r'[^a-zA-Z0-9-]', '', note_type.lower())
                note_link = f"{base_link}-{type_slug}" if base_link else ""
                
                parsed_entries.append({
                    'date': date_str,
                    'type': note_type,
                    'content': note_content,
                    'link': note_link or base_link,
                    'updated': updated,
                    'text_content': text_content
                })
                
        return parsed_entries, None
    except Exception as e:
        return [], str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    notes, error = parse_release_notes()
    if error:
        return jsonify({'success': False, 'error': error}), 500
    return jsonify({'success': True, 'notes': notes})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
