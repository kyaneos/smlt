/**
 * Charts for the Scientific Method Learning Tool
 * Uses Chart.js for data visualization
 */

// Default Chart.js settings for consistent styling
Chart.defaults.color = '#adb5bd';
Chart.defaults.font.family = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

/**
 * Create a progress chart showing completed vs. total lessons
 * @param {string} elementId - The canvas element ID to render the chart
 * @param {number} completed - Number of completed lessons
 * @param {number} total - Total number of lessons
 */
function createProgressChart(elementId, completed, total) {
    const ctx = document.getElementById(elementId)?.getContext('2d');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (window[`${elementId}Chart`]) {
        window[`${elementId}Chart`].destroy();
    }
    
    // Create chart
    window[`${elementId}Chart`] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Remaining'],
            datasets: [{
                data: [completed, total - completed],
                backgroundColor: [
                    'rgba(40, 167, 69, 0.7)',
                    'rgba(108, 117, 125, 0.3)'
                ],
                borderColor: [
                    'rgb(40, 167, 69)',
                    'rgb(108, 117, 125)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create a bar chart showing quiz scores
 * @param {string} elementId - The canvas element ID to render the chart
 * @param {Array} labels - Array of labels for each bar
 * @param {Array} scores - Array of score values
 */
function createScoresChart(elementId, labels, scores) {
    const ctx = document.getElementById(elementId)?.getContext('2d');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (window[`${elementId}Chart`]) {
        window[`${elementId}Chart`].destroy();
    }
    
    // Create chart
    window[`${elementId}Chart`] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quiz Score (%)',
                data: scores,
                backgroundColor: 'rgba(255, 193, 7, 0.5)',
                borderColor: 'rgb(255, 193, 7)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#adb5bd'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#adb5bd'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

/**
 * Create a line chart showing progress over time
 * @param {string} elementId - The canvas element ID to render the chart
 * @param {Array} labels - Array of date/time labels
 * @param {Array} data - Array of data points
 */
function createTimelineChart(elementId, labels, data) {
    const ctx = document.getElementById(elementId)?.getContext('2d');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (window[`${elementId}Chart`]) {
        window[`${elementId}Chart`].destroy();
    }
    
    // Create chart
    window[`${elementId}Chart`] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Progress',
                data: data,
                fill: false,
                borderColor: 'rgb(23, 162, 184)',
                tension: 0.1,
                pointBackgroundColor: 'rgb(23, 162, 184)',
                pointBorderColor: '#fff',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#adb5bd'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#adb5bd'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    }
                }
            }
        }
    });
}
