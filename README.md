# BigQuery Release Notes Dashboard & X Share Tool

A sleek, responsive web application that fetches Google Cloud's BigQuery release notes XML feed, groups updates by category, and facilitates sharing individual updates directly to X (formerly Twitter) with a custom composer.

## 🚀 Features

- **Live XML Feed Fetching**: Retrieves real-time BigQuery release notes directly from the Google Cloud Platform XML feed.
- **Header Header Splitting**: Gracefully parses and splits daily updates into individual category cards (Features, Changes, Deprecations).
- **Interactive Search & Filtering**: Instantly search updates by keywords or filter by release types using glassmorphic chip filters.
- **Draft & Custom Tweet Composer**: Click to select a card, which auto-generates a formatted tweet draft within the 280-character limit (along with the direct release note anchor URL).
- **Direct Sharing**: Quickly post any individual release note onto X with one click.
- **Premium UI**: Built with custom CSS variables, responsive layout, glassmorphic filters, and animated load/refresh states.

## 🛠️ Tech Stack

- **Backend**: Python Flask, `requests`, `xml.etree.ElementTree`
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+), FontAwesome (icons), Google Fonts (Inter)
- **Parser**: BeautifulSoup4, lxml

## 📦 Getting Started

### Prerequisites

- Python 3.12+

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Roathy/kaggle-cl-day2.git
   cd kaggle-cl-day2
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   *(Note: On systems with PEP 668 managed environments, use a virtual environment or pass `--break-system-packages` if appropriate).*

3. Run the development server:
   ```bash
   python app.py
   ```

4. Open your browser and navigate to:
   ```
   http://127.0.0.1:5000
   ```
