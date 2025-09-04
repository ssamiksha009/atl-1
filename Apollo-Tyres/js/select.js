document.getElementById('logoutBtn').addEventListener('click', function () {
    window.location.href = '/login.html';
});

function updateStatusIndicators() {
    const projectName = sessionStorage.getItem('currentProject');
    if (!projectName) return;

    const protocol = document.querySelector('table[style*="display: table"]').id.replace('Table', '');
    const rows = document.querySelectorAll('tbody tr');

    rows.forEach(async (row) => {
        const runNumber = row.cells[0].textContent;
        const statusCell = row.querySelector('.status-indicator');
        const runButton = row.querySelector(`.row-run-btn[data-run="${runNumber}"]`);
        const tydexButton = row.querySelector(`.tydex-btn[data-run="${runNumber}"]`);

        try {
            // Get row data to find the folder and job name
            const rowDataResponse = await fetch(`/api/get-row-data?protocol=${protocol}&runNumber=${runNumber}`);
            if (!rowDataResponse.ok) return;

            const rowDataResult = await rowDataResponse.json();
            const { p, l, job, tydex_name } = rowDataResult.data;
            const folderName = `${p}_${l}`;

            // Check if the job's ODB file exists
            const odbResponse = await fetch(`/api/check-odb-file?projectName=${projectName}&protocol=${protocol}&folderName=${folderName}&jobName=${job}`);
            const odbResult = await odbResponse.json();

            if (odbResult.exists) {
                statusCell.textContent = 'Completed ✓';
                statusCell.style.color = '#28a745';
                if (runButton) runButton.style.display = 'none';
                if (tydexButton) {
                    tydexButton.style.display = 'inline-block';

                    // Check if TYDEX file already exists
                    if (tydex_name && tydex_name.trim() !== '') {
                        const tydexResponse = await fetch(`/api/check-tydex-file?projectName=${projectName}&protocol=${protocol}&folderName=${folderName}&tydexName=${tydex_name}`);
                        const tydexResult = await tydexResponse.json();

                        if (tydexResult.exists) {
                            // TYDEX file exists, show "Open File" button directly
                            tydexButton.textContent = 'Open File';
                            tydexButton.style.backgroundColor = '#228496';
                            tydexButton.classList.add('open-file');
                            tydexButton.onclick = function () {
                                openTydexFile(runNumber);
                            };
                        } else {
                            // TYDEX file doesn't exist, show "Generate Tydex" button
                            tydexButton.textContent = 'Generate Tydex';
                            tydexButton.style.backgroundColor = '#28a745';
                            tydexButton.classList.remove('open-file');
                            tydexButton.onclick = function () {
                                generateTydex(runNumber);
                            };
                        }
                    }
                }
            } else {
                statusCell.textContent = 'Not started ✕';
                statusCell.style.color = '#dc3545';
                if (runButton) runButton.style.display = 'inline-block';
                if (tydexButton) tydexButton.style.display = 'none';
            }
        } catch (error) {
            console.error('Error checking status for run', runNumber, error);
            statusCell.textContent = 'Error checking status ✕';
            statusCell.style.color = '#dc3545';
            if (runButton) runButton.style.display = 'inline-block';
            if (tydexButton) tydexButton.style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const referer = document.referrer;
    const mf62Table = document.getElementById('mf62Table');
    const mf52Table = document.getElementById('mf52Table');
    const ftireTable = document.getElementById('ftireTable');
    const cdtireTable = document.getElementById('cdtireTable');
    const customTable = document.getElementById('customTable');
    let fetchEndpoint;

    // Hide all tables first
    mf62Table.style.display = 'none';
    mf52Table.style.display = 'none';
    ftireTable.style.display = 'none';
    cdtireTable.style.display = 'none';
    customTable.style.display = 'none';

    // Show appropriate table and set endpoint
    if (referer.includes('mf52.html')) {
        fetchEndpoint = '/api/get-mf52-data';
        mf52Table.style.display = 'table';
    } else if (referer.includes('mf.html')) {
        fetchEndpoint = '/api/get-mf-data';
        mf62Table.style.display = 'table';
    } else if (referer.includes('ftire.html')) { // Changed from 'FTire.html' to 'ftire.html'
        fetchEndpoint = '/api/get-ftire-data';
        ftireTable.style.display = 'table';
    } else if (referer.includes('cdtire.html')) {
        fetchEndpoint = '/api/get-cdtire-data';
        cdtireTable.style.display = 'table';
    } else if (referer.includes('custom.html')) {
        fetchEndpoint = '/api/get-custom-data';
        customTable.style.display = 'table';
    } else {
        document.getElementById('data-container').innerHTML =
            '<p class="error-message">Please select a protocol first</p>';
        return;
    }

    // Set protocol title based on referer
    const protocolTitle = document.getElementById('protocol-title');
    if (referer.includes('mf52.html')) {
        protocolTitle.textContent = 'MF 5.2 Protocol';
    } else if (referer.includes('mf.html')) {
        protocolTitle.textContent = 'MF 6.2 Protocol';
    } else if (referer.includes('ftire.html')) {
        protocolTitle.textContent = 'FTire Protocol';
    } else if (referer.includes('cdtire.html')) {
        protocolTitle.textContent = 'CDTire Protocol';
    } else if (referer.includes('custom.html')) {
        protocolTitle.textContent = 'Custom Protocol';
    }

    // Fetch and display appropriate data
    fetch(fetchEndpoint)
        .then(response => response.json())
        .then(data => {
            if (referer.includes('mf52.html')) {
                displayMF52Data(data);
            } else if (referer.includes('mf.html')) {
                displayMF62Data(data);
            } else if (referer.includes('ftire.html')) {
                displayFTireData(data);
            } else if (referer.includes('cdtire.html')) {
                displayCDTireData(data);
            } else if (referer.includes('custom.html')) {
                displayCustomData(data);
            }
            // Update status indicators after displaying data
            updateStatusIndicators();
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('data-container').innerHTML =
                '<p class="error-message">Error loading data</p>';
        });
});

// Add event listener for page visibility changes
document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
        updateStatusIndicators();
    }
});

function createRunButton(runNumber) {
    // Initially create all buttons but hidden
    return `<button class="row-run-btn" data-run="${runNumber}" style="display: none">Run</button>`;
}

function createTydexButton(runNumber) {
    return `<button class="tydex-btn" data-run="${runNumber}" style="display: none">Generate Tydex</button>`;
}

function displayMF62Data(data) {
    const tableBody = document.getElementById('mf62TableBody');
    if (!tableBody) return;

    tableBody.innerHTML = ''; // Clear existing data

    // Filter out rows where tests field is empty
    const filteredData = data.filter(row => row.tests && row.tests.trim() !== '');

    filteredData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.number_of_runs}</td>
            <td>${row.tests}</td>
            <td>${row.ips}</td>
            <td>${row.loads}</td>
            <td>${row.inclination_angle}</td>
            <td>${row.slip_angle}</td>
            <td>${row.slip_ratio}</td>
            <td>${row.test_velocity}</td>
            <td class="status-cell">
                <span class="status-indicator">Not started ✕</span>
            </td>
            <td class="run-button-cell">
                ${createRunButton(row.number_of_runs)}
            </td>
            <td class="tidex-button-cell">
                ${createTydexButton(row.number_of_runs)}
            </td>
        `;
        tableBody.appendChild(tr);
    });

    // Add event listeners to run buttons
    document.querySelectorAll('.row-run-btn').forEach(button => {
        button.addEventListener('click', function (e) {
            e.stopPropagation();
            const runNumber = this.getAttribute('data-run');
            runSingleAnalysis(runNumber);
        });
    });

    // Add event listeners to tydex buttons
    document.querySelectorAll('.tydex-btn').forEach(button => {
        button.addEventListener('click', function (e) {
            e.stopPropagation();
            const runNumber = this.getAttribute('data-run');
            generateTydex(runNumber);
        });
    });
}

function displayMF52Data(data) {
    const tableBody = document.getElementById('mf52TableBody');
    if (!tableBody) return;

    tableBody.innerHTML = ''; // Clear existing data

    // Filter out rows where tests field is empty
    const filteredData = data.filter(row => row.tests && row.tests.trim() !== '');

    filteredData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.number_of_runs}</td>
            <td>${row.tests}</td>
            <td>${row.inflation_pressure}</td>
            <td>${row.loads}</td>
            <td>${row.inclination_angle}</td>
            <td>${row.slip_angle}</td>
            <td>${row.slip_ratio}</td>
            <td>${row.test_velocity}</td>
            <td class="status-cell">
                <span class="status-indicator">Not started ✕</span>
            </td>
            <td class="run-button-cell">
                ${createRunButton(row.number_of_runs)}
            </td>
            <td class="tidex-button-cell">
                ${createTydexButton(row.number_of_runs)}
            </td>
        `;
        tableBody.appendChild(tr);
    });

    // Add event listeners to run buttons
    document.querySelectorAll('.row-run-btn').forEach(button => {
        button.addEventListener('click', function (e) {
            e.stopPropagation();
            const runNumber = this.getAttribute('data-run');
            runSingleAnalysis(runNumber);
        });
    });

    // Add event listeners to tydex buttons
    document.querySelectorAll('.tydex-btn').forEach(button => {
        button.addEventListener('click', function (e) {
            e.stopPropagation();
            const runNumber = this.getAttribute('data-run');
            generateTydex(runNumber);
        });
    });
}

function displayFTireData(data) {
    const tableBody = document.getElementById('ftireTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    // Filter out rows where tests field is empty
    const filteredData = data.filter(row => row.tests && row.tests.trim() !== '');

    filteredData.forEach(row => {
        const tr = document.createElement('tr');
        // Updated order to match Excel columns:
        // S.No, Test, Load (N), IP (Kpa), Speed (kmph), Longitudinal Slip (%), Slip Angle (deg), Inclination Angle (deg), Cleat Orientation (deg)
        tr.innerHTML = `
            <td>${row.number_of_runs}</td>
            <td>${row.tests}</td>
            <td>${row.loads}</td>
            <td>${row.inflation_pressure}</td>
            <td>${row.test_velocity}</td>
            <td>${row.longitudinal_slip}</td>
            <td>${row.slip_angle}</td>
            <td>${row.inclination_angle}</td>
            <td>${row.cleat_orientation}</td>
            <td class="status-cell">
                <span class="status-indicator">Not started ✕</span>
            </td>
            <td class="run-button-cell">
                ${createRunButton(row.number_of_runs)}
            </td>
            <td class="tidex-button-cell">
                ${createTydexButton(row.number_of_runs)}
            </td>
        `;
        tableBody.appendChild(tr);
    });

    // Add event listeners to run buttons
    document.querySelectorAll('.row-run-btn').forEach(button => {
        button.addEventListener('click', function (e) {
            e.stopPropagation();
            const runNumber = this.getAttribute('data-run');
            runSingleAnalysis(runNumber);
        });
    });

    // Add event listeners to tydex buttons
    document.querySelectorAll('.tydex-btn').forEach(button => {
        button.addEventListener('click', function (e) {
            e.stopPropagation();
            const runNumber = this.getAttribute('data-run');
            generateTydex(runNumber);
        });
    });
}

function displayCDTireData(data) {
    const tableBody = document.getElementById('cdtireTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    // Filter out rows where test_name field is empty
    const filteredData = data.filter(row => row.test_name && row.test_name.trim() !== '');

    filteredData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.number_of_runs}</td>
            <td>${row.test_name}</td>
            <td>${row.inflation_pressure}</td>
            <td>${row.velocity}</td>
            <td>${row.preload}</td>
            <td>${row.camber}</td>
            <td>${row.slip_angle}</td>
            <td>${row.displacement}</td>
            <td>${row.slip_range}</td>
            <td>${row.cleat}</td>
            <td>${row.road_surface}</td>
            <td class="status-cell">
                <span class="status-indicator">Not started ✕</span>
            </td>
            <td class="run-button-cell">
                ${createRunButton(row.number_of_runs)}
            </td>
            <td class="tidex-button-cell">
                ${createTydexButton(row.number_of_runs)}
            </td>
        `;
        tableBody.appendChild(tr);
    });

    // Add event listeners to run buttons
    document.querySelectorAll('.row-run-btn').forEach(button => {
        button.addEventListener('click', function (e) {
            e.stopPropagation();
            const runNumber = this.getAttribute('data-run');
            runSingleAnalysis(runNumber);
        });
    });

    // Add event listeners to tydex buttons
    document.querySelectorAll('.tydex-btn').forEach(button => {
        button.addEventListener('click', function (e) {
            e.stopPropagation();
            const runNumber = this.getAttribute('data-run');
            generateTydex(runNumber);
        });
    });
}

function displayCustomData(data) {
    const tableBody = document.getElementById('customTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    // Filter out rows where tests field is empty
    const filteredData = data.filter(row => row.tests && row.tests.trim() !== '');

    filteredData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.number_of_runs}</td>
            <td>${row.tests}</td>
            <td>${row.inflation_pressure}</td>
            <td>${row.loads}</td>
            <td>${row.inclination_angle}</td>
            <td>${row.slip_angle}</td>
            <td>${row.slip_ratio}</td>
            <td>${row.test_velocity}</td>
            <td>${row.cleat_orientation}</td>
            <td>${row.displacement}</td>
            <td class="status-cell">
                <span class="status-indicator">Not started ✕</span>
            </td>
            <td class="run-button-cell">
                ${createRunButton(row.number_of_runs)}
            </td>
            <td class="tidex-button-cell">
                ${createTydexButton(row.number_of_runs)}
            </td>
        `;
        tableBody.appendChild(tr);
    });

    // Add event listeners to run buttons
    document.querySelectorAll('.row-run-btn').forEach(button => {
        button.addEventListener('click', function (e) {
            e.stopPropagation();
            const runNumber = this.getAttribute('data-run');
            runSingleAnalysis(runNumber);
        });
    });

    // Add event listeners to tydex buttons
    document.querySelectorAll('.tydex-btn').forEach(button => {
        button.addEventListener('click', function (e) {
            e.stopPropagation();
            const runNumber = this.getAttribute('data-run');
            generateTydex(runNumber);
        });
    });
}

async function runSingleAnalysis(runNumber) {
    const projectName = sessionStorage.getItem('currentProject');
    if (!projectName) {
        window.location.href = '/index.html';
        return;
    }

    const protocol = document.querySelector('table[style*="display: table"]').id.replace('Table', '');

    // Find the row and get its UI elements
    const row = document.querySelector(`tr:has(button[data-run="${runNumber}"])`);
    const statusCell = row.querySelector('.status-indicator');
    const runButton = row.querySelector('.row-run-btn');
    const tydexButton = row.querySelector('.tydex-btn');

    // --- NEW: Fetch job and old_job for this run ---
    let jobName = '';
    let oldJobName = '';
    try {
        const rowDataResponse = await fetch(`/api/get-row-data?protocol=${protocol}&runNumber=${runNumber}`);
        if (rowDataResponse.ok) {
            const rowDataResult = await rowDataResponse.json();
            jobName = rowDataResult.data?.job || '';
            oldJobName = rowDataResult.data?.old_job || '';
        }
    } catch (e) {
        // fallback: leave jobName empty
    }
    // --- END NEW ---

    // Show job name in status
    let jobDisplay = jobName ? jobName : '';
    if (oldJobName && oldJobName !== '-' && oldJobName !== jobName) {
        jobDisplay = `${oldJobName} (dependency)`;
    }
    statusCell.textContent = jobDisplay
        ? `Processing: ${jobDisplay} ⌛`
        : 'Processing... ⌛';
    statusCell.style.color = '#ffc107';
    runButton.disabled = true;

    try {
        // Use the new dependency resolution endpoint that handles everything
        const response = await fetch('/api/resolve-job-dependencies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectName,
                protocol,
                runNumber
            })
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.message || 'Failed to resolve dependencies');
        }

        const result = await response.json();

        if (result.success) {
            statusCell.textContent = 'Completed ✓';
            statusCell.style.color = '#28a745';
            runButton.style.display = 'none';
            if (tydexButton) tydexButton.style.display = 'inline-block';
        } else {
            throw new Error(result.message || 'Job execution failed');
        }

    } catch (error) {
        console.error('Error during job execution:', error);
        statusCell.textContent = 'Error ⚠️';
        statusCell.style.color = '#dc3545';
        runButton.disabled = false;
        alert('Error during job execution: ' + error.message);
    }
}

async function generateTydex(runNumber) {
    const projectName = sessionStorage.getItem('currentProject');
    if (!projectName) {
        window.location.href = '/index.html';
        return;
    }

    const protocol = document.querySelector('table[style*="display: table"]').id.replace('Table', '');

    // Find the row and get its UI elements
    const row = document.querySelector(`tr:has(button[data-run="${runNumber}"])`);
    const tydexButton = row.querySelector('.tydex-btn');

    try {
        // Get row data for the TYDEX generation from database
        const rowDataResponse = await fetch(`/api/get-row-data?protocol=${protocol}&runNumber=${runNumber}`);
        if (!rowDataResponse.ok) {
            throw new Error('Failed to get row data');
        }

        const rowDataResult = await rowDataResponse.json();
        const rowData = rowDataResult.data;

        if (!rowData.template_tydex || rowData.template_tydex.trim() === '') {
            throw new Error('No template_tydex found for this row');
        }

        // Update button state
        tydexButton.disabled = true;
        tydexButton.textContent = 'Generating...';

        // Call the TYDEX generation API with complete row data
        const response = await fetch('/api/generate-tydex', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                protocol: getProtocolFromCurrentTable(),
                projectName: projectName,
                rowData: rowData  // Pass the complete row data from database
            })
        });

        const result = await response.json();

        if (result.success) {
            // Replace the button with "Open File" button in teal color
            tydexButton.textContent = 'Open File';
            tydexButton.style.backgroundColor = '#228496';
            tydexButton.classList.add('open-file');
            tydexButton.disabled = false;

            // Remove old event listeners and add new one for opening file
            tydexButton.onclick = function () {
                openTydexFile(runNumber);
            };
        } else {
            throw new Error(result.message || 'Failed to generate TYDEX file');
        }

    } catch (error) {
        console.error('Error generating Tydex:', error);
        tydexButton.disabled = false;
        tydexButton.textContent = 'Generate Tydex';
        alert('Error generating Tydex: ' + error.message);
    }
}

async function openTydexFile(runNumber) {
    const projectName = sessionStorage.getItem('currentProject');
    if (!projectName) {
        window.location.href = '/index.html';
        return;
    }

    const protocol = document.querySelector('table[style*="display: table"]').id.replace('Table', '');

    try {
        // Get row data to find the tydex_name and folder info
        const rowDataResponse = await fetch(`/api/get-row-data?protocol=${protocol}&runNumber=${runNumber}`);
        if (!rowDataResponse.ok) {
            throw new Error('Failed to get row data');
        }

        const rowDataResult = await rowDataResponse.json();
        const { p, l, tydex_name } = rowDataResult.data;

        // Call server endpoint to open the file
        const response = await fetch('/api/open-tydex-file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                protocol: getProtocolFromCurrentTable(),
                projectName: projectName,
                p: p,
                l: l,
                tydex_name: tydex_name
            })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Failed to open TYDEX file');
        }

    } catch (error) {
        console.error('Error opening Tydex file:', error);
        alert('Error opening Tydex file: ' + error.message);
    }
}

// Add event listener for Generate Tydex buttons
document.addEventListener('click', function (e) {
    if (e.target && e.target.classList.contains('tydex-btn')) {
        const button = e.target;
        const row = button.closest('tr');
        const protocol = getProtocolFromCurrentTable();
        const projectName = sessionStorage.getItem('currentProject') || 'DefaultProject';

        // Extract row data
        const rowData = extractRowData(row, protocol);

        if (!rowData) {
            alert('Unable to extract row data');
            return;
        }

        button.disabled = true;
        button.textContent = 'Generating...';

        // Call server to generate TYDEX
        generateTydexFile(protocol, projectName, rowData)
            .then(result => {
                if (result.success) {
                    button.textContent = 'Generated';
                    button.style.backgroundColor = '#6c757d';
                    alert('TYDEX file generated successfully!');
                } else {
                    throw new Error(result.message || 'Failed to generate TYDEX file');
                }
            })
            .catch(error => {
                console.error('Error generating TYDEX:', error);
                button.disabled = false;
                button.textContent = 'Generate Tydex';
                alert('Error generating TYDEX file: ' + error.message);
            });
    }
});

function getProtocolFromCurrentTable() {
    const visibleTables = document.querySelectorAll('.data-table:not([style*="display: none"])');
    if (visibleTables.length > 0) {
        const tableId = visibleTables[0].id;
        switch (tableId) {
            case 'mf62Table': return 'MF6pt2';
            case 'mf52Table': return 'MF5pt2';
            case 'ftireTable': return 'FTire';
            case 'cdtireTable': return 'CDTire';
            case 'customTable': return 'Custom';
            default: return 'Unknown';
        }
    }
    return 'Unknown';
}

function extractRowData(row, protocol) {
    const cells = row.querySelectorAll('td');
    if (cells.length === 0) return null;

    const data = {
        protocol: protocol,
        tydex_name: '',
        p: '',
        l: ''
    };

    // Extract based on protocol
    switch (protocol) {
        case 'MF6pt2':
        case 'MF5pt2':
            data.tydex_name = cells[10]?.textContent.trim() || '';
            data.p = cells[11]?.textContent.trim() || '';
            data.l = cells[12]?.textContent.trim() || '';
            break;
        case 'FTire':
            data.tydex_name = cells[11]?.textContent.trim() || '';
            data.p = cells[12]?.textContent.trim() || '';
            data.l = cells[13]?.textContent.trim() || '';
            break;
        case 'CDTire':
            data.tydex_name = cells[13]?.textContent.trim() || '';
            data.p = cells[14]?.textContent.trim() || '';
            data.l = cells[15]?.textContent.trim() || '';
            break;
        case 'Custom':
            data.tydex_name = cells[12]?.textContent.trim() || '';
            data.p = cells[13]?.textContent.trim() || '';
            data.l = cells[14]?.textContent.trim() || '';
            break;
    }

    return data;
}

function generateTydexFile(protocol, projectName, rowData) {
    return fetch('/api/generate-tydex', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            protocol: protocol,
            projectName: projectName,
            rowData: rowData
        })
    })
        .then(response => response.json());
}

// Add event listener for Complete Project button
document.getElementById('completeProjectBtn').addEventListener('click', async function () {
    const projectName = sessionStorage.getItem('currentProject');
    if (!projectName) {
        alert('No project selected');
        return;
    }

    if (!confirm('Are you sure you want to mark this project as complete?')) {
        return;
    }

    try {
        const response = await fetch('/api/mark-project-complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                project_name: projectName
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('Project marked as completed successfully!');
            window.location.href = '/history.html'; // Redirect to history page
        } else {
            throw new Error(data.message || 'Failed to complete project');
        }
    } catch (error) {
        console.error('Error completing project:', error);
        alert('Failed to mark project as complete: ' + error.message);
    }
});

// Add near existing completeProjectBtn handler
document.getElementById('markInProgressBtn').addEventListener('click', async function () {
    const projectName = sessionStorage.getItem('currentProject');
    if (!projectName) {
        alert('No project selected');
        return;
    }

    if (!confirm('Mark this project as In Progress?')) return;

    try {
        const res = await fetch('/api/mark-project-in-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectName })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Failed to update project status');
        // Redirect to history page where user can view the project
        window.location.href = '/history.html';
    } catch (err) {
        console.error(err);
        alert('Failed to mark project as In Progress: ' + (err.message || err));
    }
});


