document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const feedContainer = document.getElementById('release-notes-feed');
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const emptyState = document.getElementById('empty-state');
    const errorMessage = document.getElementById('error-message');
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshIcon = document.getElementById('refresh-icon');
    const retryBtn = document.getElementById('retry-btn');
    const searchInput = document.getElementById('search-input');
    const filterChips = document.querySelectorAll('.filter-chip');
    
    // Tweet Composer Elements
    const tweetText = document.getElementById('tweet-text');
    const charCounter = document.getElementById('char-counter');
    const tweetBtn = document.getElementById('tweet-btn');
    const selectedPreview = document.getElementById('selected-preview');
    const previewContent = document.getElementById('preview-content');
    const clearSelectionBtn = document.getElementById('clear-selection-btn');
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toast-text');

    // State Variables
    let allNotes = [];
    let activeCategory = 'all';
    let searchQuery = '';
    let selectedNote = null;

    // Fetch Release Notes
    async function fetchReleaseNotes() {
        showLoading(true);
        try {
            const response = await fetch('/api/release-notes');
            const data = await response.json();
            
            if (data.success) {
                allNotes = data.notes;
                renderFeed();
                showToast('Release notes fetched successfully!');
            } else {
                throw new Error(data.error || 'Failed to fetch release notes.');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showError(error.message);
        } finally {
            showLoading(false);
        }
    }

    // Render Feed based on Filters
    function renderFeed() {
        // Filter Notes
        const filteredNotes = allNotes.filter(note => {
            const matchesCategory = activeCategory === 'all' || 
                                    note.type.toLowerCase() === activeCategory;
            
            const matchesSearch = note.date.toLowerCase().includes(searchQuery) ||
                                  note.type.toLowerCase().includes(searchQuery) ||
                                  note.text_content.toLowerCase().includes(searchQuery);
                                  
            return matchesCategory && matchesSearch;
        });

        // Toggle visibility
        if (filteredNotes.length === 0) {
            feedContainer.innerHTML = '';
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
            
            feedContainer.innerHTML = filteredNotes.map((note, index) => {
                const isSelected = selectedNote && selectedNote.link === note.link && selectedNote.type === note.type;
                const typeClass = getTypeClass(note.type);
                
                return `
                    <div class="release-card ${isSelected ? 'selected' : ''}" data-index="${index}" id="note-card-${index}">
                        <div class="card-header">
                            <div class="card-tags">
                                <span class="type-tag ${typeClass}">${note.type}</span>
                            </div>
                            <span class="date-text">${note.date}</span>
                        </div>
                        <div class="card-body">
                            ${note.content}
                        </div>
                        <div class="card-footer">
                            <div class="select-indicator">
                                <i class="${isSelected ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'}"></i>
                                <span>${isSelected ? 'Selected for Tweet' : 'Click to select'}</span>
                            </div>
                            <button class="card-tweet-btn" data-index="${index}" title="Tweet this specific note">
                                <i class="fa-brands fa-x-twitter"></i> Tweet
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            // Attach event listeners to newly rendered cards
            attachCardEvents(filteredNotes);
        }
    }

    // Attach Event Listeners to cards
    function attachCardEvents(notesList) {
        // Card click for selection
        document.querySelectorAll('.release-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // If clicked on tweet button or anchor link inside card, let them handle it
                if (e.target.closest('.card-tweet-btn') || e.target.closest('a')) {
                    return;
                }
                const index = parseInt(card.dataset.index);
                selectNote(notesList[index]);
            });
        });

        // Direct tweet button click
        document.querySelectorAll('.card-tweet-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                tweetDirectly(notesList[index]);
            });
        });
    }

    // Select a note and pre-populate composer
    function selectNote(note) {
        selectedNote = note;
        
        // Show selection in CSS
        renderFeed();
        
        // Populate composer preview
        previewContent.innerHTML = `<strong>[${note.type}]</strong> ${note.text_content}`;
        selectedPreview.style.display = 'block';

        // Auto-generate tweet text template
        const typePrefix = `BigQuery ${note.type}: `;
        const linkStr = note.link ? ` ${note.link}` : '';
        const maxLength = 280 - typePrefix.length - linkStr.length;
        
        let excerpt = note.text_content;
        if (excerpt.length > maxLength) {
            excerpt = excerpt.substring(0, maxLength - 3) + '...';
        }

        tweetText.value = `${typePrefix}${excerpt}${linkStr}`;
        updateCharCounter();
        
        showToast('Update selected for composing.');
    }

    // Clear Selected Note
    function clearSelection() {
        selectedNote = null;
        selectedPreview.style.display = 'none';
        previewContent.innerHTML = '';
        tweetText.value = '';
        updateCharCounter();
        renderFeed();
    }

    // Direct Tweet helper
    function tweetDirectly(note) {
        const typePrefix = `BigQuery ${note.type}: `;
        const linkStr = note.link ? ` ${note.link}` : '';
        const maxLength = 280 - typePrefix.length - linkStr.length;
        
        let excerpt = note.text_content;
        if (excerpt.length > maxLength) {
            excerpt = excerpt.substring(0, maxLength - 3) + '...';
        }
        
        const text = `${typePrefix}${excerpt}${linkStr}`;
        openTwitterShare(text);
    }

    // Update Char Counter & Enable/Disable Share Button
    function updateCharCounter() {
        const len = tweetText.value.length;
        charCounter.textContent = `${len} / 280`;

        if (len > 280) {
            charCounter.className = 'char-counter danger';
            tweetBtn.disabled = true;
        } else if (len > 250) {
            charCounter.className = 'char-counter warning';
            tweetBtn.disabled = false;
        } else {
            charCounter.className = 'char-counter';
            tweetBtn.disabled = len === 0;
        }
    }

    // Open X Share Intent Window
    function openTwitterShare(text) {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank', 'width=550,height=420,toolbar=no,menubar=no,scrollbars=yes');
    }

    // Helper functions
    function getTypeClass(type) {
        const t = type.toLowerCase();
        if (t.includes('feature')) return 'feature';
        if (t.includes('change')) return 'change';
        if (t.includes('deprecation')) return 'deprecation';
        return 'general';
    }

    function showLoading(isLoading) {
        if (isLoading) {
            loadingState.style.display = 'flex';
            errorState.style.display = 'none';
            feedContainer.style.display = 'none';
            refreshIcon.classList.add('fa-spin-custom');
            refreshBtn.disabled = true;
        } else {
            loadingState.style.display = 'none';
            feedContainer.style.display = 'grid';
            refreshIcon.classList.remove('fa-spin-custom');
            refreshBtn.disabled = false;
        }
    }

    function showError(message) {
        loadingState.style.display = 'none';
        feedContainer.style.display = 'none';
        errorState.style.display = 'flex';
        errorMessage.textContent = message;
    }

    function showToast(message) {
        toastText.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Event Listeners
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    retryBtn.addEventListener('click', fetchReleaseNotes);
    clearSelectionBtn.addEventListener('click', clearSelection);
    
    tweetText.addEventListener('input', updateCharCounter);
    
    tweetBtn.addEventListener('click', () => {
        const text = tweetText.value;
        if (text && text.length <= 280) {
            openTwitterShare(text);
        }
    });

    // Search bar functionality (Debounced)
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchQuery = e.target.value.toLowerCase().strip ? e.target.value.toLowerCase().strip() : e.target.value.toLowerCase();
            renderFeed();
        }, 200);
    });

    // Filter Chips functionality
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeCategory = chip.dataset.category;
            renderFeed();
        });
    });

    // Initial load
    fetchReleaseNotes();
});
