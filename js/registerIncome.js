document.getElementById('filter').addEventListener('input', (event) => {
    filterValue = event.target.value.trim().toLowerCase();
    applyFilters();
});

document.getElementById('year-filter').addEventListener('change', (event) => {
    yearFilterValue = event.target.value;
    applyFilters();
});

document.getElementById('month-filter').addEventListener('change', (event) => {
    monthFilterValue = event.target.value;
    applyFilters();
});

document.addEventListener('DOMContentLoaded', () => {
    const { year, month } = getCurrentYearAndMonth();
    yearFilterValue = year;
    monthFilterValue = month;
    document.getElementById('year-filter').value = yearFilterValue;
    document.getElementById('month-filter').value = monthFilterValue;
});

document.getElementById('createRegisterIncome').addEventListener('click', () => {
    createCashRegisterIncome();
});

function showAlert(status) {
    const alertsContainer = document.getElementById('alert-message');
    alertsContainer.innerHTML = `
          <div class="alert alert-success">
              <strong>Success!</strong>${status}.
          </div>
      `;
    setTimeout(() => {
        alertsContainer.innerHTML = '';
    }, 3000);
}

let allCashRegisterIncomes = [];
let filterValue = '';
let yearFilterValue = '';
let monthFilterValue = '';

function getCurrentYearAndMonth() {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return { year, month };
}

function populateYearFilter() {
    const yearSelect = document.getElementById('year-filter');
    const years = [...new Set(allCashRegisterIncomes.map(cashRegisterIncome => new Date(cashRegisterIncome.cashRegisterIncomeDate).getFullYear()))];

    years.sort().forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });
}

function applyFilters() {
    if (allCashRegisterIncomes.length === 0) return;

    let filteredCashRegisterIncomes = allCashRegisterIncomes.filter(cashRegisterIncome => {
        const matchesFilterValue = cashRegisterIncome.cashRegisterIncomeNumber.toLowerCase().includes(filterValue.toLowerCase()) ||
            cashRegisterIncome.invoice.invoiceNumber.toLowerCase().includes(filterValue.toLowerCase()) || cashRegisterIncome.supplier.name.toLowerCase().includes(filterValue.toLowerCase());

        const cashRegisterIncomeDate = new Date(cashRegisterIncome.cashRegisterIncomeDate);
        const cashRegisterIncomeYear = cashRegisterIncomeDate.getFullYear().toString();
        const cashRegisterIncomeMonth = (cashRegisterIncomeDate.getMonth() + 1).toString().padStart(2, '0');

        const matchesYear = !yearFilterValue || cashRegisterIncomeYear === yearFilterValue;
        const matchesMonth = !monthFilterValue || cashRegisterIncomeMonth === monthFilterValue;

        return matchesFilterValue && matchesYear && matchesMonth;
    });

    displayCashRegisterIncomes(filteredCashRegisterIncomes);
}

async function fetchCashRegisterIncomes() {
    try {
        const response = await axios.get("http://localhost:8090/api/pajamos_grynais");
        const cashRegisterIncomes = response.data;

        if (!Array.isArray(cashRegisterIncomes)) {
            throw new Error('Invalid data format');
        }
        allCashRegisterIncomes = cashRegisterIncomes;
        applyFilters();

    } catch (error) {
        console.error('Error fetching cash register incomes:', error);
    }
}

function displayCashRegisterIncomes(cashRegisterIncomes) {
    const cashRegisterIncomesTable = document.getElementById('register-income-table');
    cashRegisterIncomesTable.querySelector('tbody').innerHTML = '';

    let totalSumBeforeTax = 0;
    let totalTax = 0;
    let totalSumAfterTax = 0;

    cashRegisterIncomes.forEach((cashRegisterIncome, index) => {
        if (cashRegisterIncome && cashRegisterIncome.id) {
            totalSumBeforeTax += parseFloat(cashRegisterIncome.sumBeforeTax);
            totalTax += parseFloat(cashRegisterIncome.tax);
            totalSumAfterTax += parseFloat(cashRegisterIncome.sumAfterTax);

            let filename = cashRegisterIncome.pdfFilePath ? cashRegisterIncome.pdfFilePath.split('\\').pop() : 'no-file.pdf';
            filename = filename.replace(/\(/g, '%28').replace(/\)/g, '%29');
            const fileUrl = `http://localhost:8090/uploads/${filename}`;

            const fileInputId = `fileInput-${cashRegisterIncome.id}`;

            const cashRegisterIncomeRow = `
                <tr id="cashRegisterIncome-row-${cashRegisterIncome.id}" class="cashRegisterIncome-row">
                <th scope="row">${index + 1}</th>
                <td>${cashRegisterIncome.pdfFilePath ? `<a href="${fileUrl}" target="_blank"><img src="../pictures/icon.png" alt="PDF Icon" width="16" height="16"></a>` : 'No file'}
                </td>
                <td>${cashRegisterIncome.cashRegisterIncomeNumber}</td>
                <td>${cashRegisterIncome.cashRegisterIncomeDate}</td>
                <td>${cashRegisterIncome.sumBeforeTax}</td>
                <td>${cashRegisterIncome.tax}</td>
                <td>${cashRegisterIncome.sumAfterTax}</td>
                <td><button id="updateCashRegisterIncome-${cashRegisterIncome.id}" data-id="${cashRegisterIncome.id}">Redaguoti</button></td>
                <td><button id="deleteCashRegisterIncome-${cashRegisterIncome.id}" data-id="${cashRegisterIncome.id}">Ištrinti</button></td>
                <td>
                <form id="uploadForm-${cashRegisterIncome.id}" enctype="multipart/form-data">
                <label for="${fileInputId}" class="custom-file-input">
                <span class="file-name">+</span>
                <input type="file" id="${fileInputId}" name="file" accept="application/pdf" onchange="handleFileSelect(this, ${cashRegisterIncome.id})">
                </label>
                </form>
                </td>
                <td>
                <button type="button" onclick="uploadPdf(${cashRegisterIncome.id}, document.getElementById('${fileInputId}'))">Išsaugoti</button>
                </td>
            </tr>
        `;

            cashRegisterIncomesTable.querySelector('tbody').insertAdjacentHTML('beforeend', cashRegisterIncomeRow);

            const deleteButton = document.getElementById(`deleteCashRegisterIncome-${cashRegisterIncome.id}`);
            deleteButton.addEventListener('click', async () => {
                const confirmation = confirm(`Ar tikrai norite ištrinti kasos kvitą: ${cashRegisterIncome.cashRegisterIncomeNumber} ; data:  ${cashRegisterIncome.cashRegisterIncomeDate}?`);
                if (confirmation) {
                    await deleteCashRegisterIncome(cashRegisterIncome.id);
                }
            });

            const updateButton = document.getElementById(`updateCashRegisterIncome-${cashRegisterIncome.id}`);
            updateButton.addEventListener('click', async () => {
                let existingEditInputRow = document.querySelector('tr[id^="inputRow-"]');
                if (existingEditInputRow) {
                    existingEditInputRow.remove();
                }
                const inputRow = document.createElement('tr');
                inputRow.id = `inputRow-${cashRegisterIncome.id}`;
                inputRow.classList.add('cashRegisterIncome-row');

                inputRow.innerHTML = `
                <td colspan="8">
                    <div class="form-container">
                        <div class="form-group">
                            <label for="cashRegisterIncomeNumber">Orderio numeris</label>
                            <input type="text" id="cashRegisterIncomeNumberEdit-${cashRegisterIncome.id}" class="form-control" value="${cashRegisterIncome.cashRegisterIncomeNumber}">
                        </div>      
                        <div class="form-group">
                            <label for="cashRegisterIncomeDate">Orderio data</label>  
                            <input type="text" id="cashRegisterIncomeDateEdit-${cashRegisterIncome.id}" class="form-control" value="${cashRegisterIncome.cashRegisterIncomeDate}">
                        </div> 
                        <div class="form-group">
                            <label for="sum">Suma be PVM</label>
                            <input type="text" id="sumBeforeTaxEdit-${cashRegisterIncome.id}" class="form-control" value="${cashRegisterIncome.sumBeforeTax}">
                        </div>
                        <div class="form-group">
                            <label for="sum">PVM</label>
                            <input type="text" id="taxEdit-${cashRegisterIncome.id}" class="form-control" value="${cashRegisterIncome.tax}">
                        </div>
                        <div class="form-group">
                            <label for="sum">Suma su PVM</label>
                            <input type="text" id="sumAfterTaxEdit-${cashRegisterIncome.id}" class="form-control" value="${cashRegisterIncome.sumAfterTax}">
                        </div>
                        <div class="form-group">
                        <button type="button" class="btn btn-outline-success" id="saveCashRegisterIncome-${cashRegisterIncome.id}">Išsaugoti</button>
                        </div>
                    </div>
                </td>
                `;

                const existingInputRow = document.getElementById(`inputRow-${cashRegisterIncome.id}`);
                if (existingInputRow) {
                    existingInputRow.remove();
                }

                document.getElementById(`cashRegisterIncome-row-${cashRegisterIncome.id}`).insertAdjacentElement('afterend', inputRow);

                document.getElementById(`saveCashRegisterIncome-${cashRegisterIncome.id}`).addEventListener('click', () => {
                    updateCashRegisterIncome(cashRegisterIncome.id);
                });
            });
        } else {
            console.warn('Invalid check object:', cashRegisterIncome);
        }
    });

    document.getElementById('totalSumBeforeTax').querySelector('span').innerText = `${totalSumBeforeTax.toFixed(2)}`;
    document.getElementById('totalSumTax').querySelector('span').innerText = `${totalTax.toFixed(2)}`;
    document.getElementById('totalSumAfterTax').querySelector('span').innerText = `${totalSumAfterTax.toFixed(2)}`;
}

async function updateCashRegisterIncome(cashRegisterIncomeId) {
    const apiUrl = 'http://localhost:8090/api/pajamos_grynais';
    const cashRegisterIncomeNumber = document.getElementById(`cashRegisterIncomeNumberEdit-${cashRegisterIncomeId}`).value;
    const cashRegisterIncomeDate = document.getElementById(`cashRegisterIncomeDateEdit-${cashRegisterIncomeId}`).value;
    const sumBeforeTax = document.getElementById(`sumBeforeTaxEdit-${cashRegisterIncomeId}`).value;
    const tax = document.getElementById(`taxEdit-${cashRegisterIncomeId}`).value;
    const sumAfterTax = document.getElementById(`sumAfterTaxEdit-${cashRegisterIncomeId}`).value;

    const cashRegisterIncome = {
        cashRegisterIncomeNumber,
        cashRegisterIncomeDate,
        sumBeforeTax,
        tax,
        sumAfterTax
    };

    try {
        await axios.put(`${apiUrl}/${cashRegisterIncomeId}`, cashRegisterIncome);
        showAlert(" Kvitas išsaugotas")

        const cashRegisterIncomes = await fetchCashRegisterIncomes();
        applyFilters();

        const inputRow = document.getElementById(`inputRow-${cashRegisterIncomeId}`);
        if (inputRow) {
            inputRow.remove();
        }

    } catch (error) {
        console.error('Error saving check:', error);
    }
}

async function createCashRegisterIncome() {
    if (document.querySelector('.cashRegisterIncomeCreate-row')) return;
    let existingCreateInputRow = document.querySelector('tr[id^="createInputRow-"]');
    if (existingCreateInputRow) {
        existingCreateInputRow.remove();
    }
    const createInputRow = document.createElement('tr');
    createInputRow.classList.add('cashRegisterIncomeCreate-row');

    createInputRow.innerHTML = `
                <td colspan="8">
                    <div class="form-container">
                        <div class="form-group">
                            <label for="cashRegisterIncomeNumber">Kvito numeris</label>
                            <input type="text" id="cashRegisterIncomeNumberCreate" class="form-control">
                        </div>      
                        <div class="form-group">
                            <label for="cashRegisterIncomeDate">Kvito data</label>  
                            <input type="text" id="cashRegisterIncomeDateCreate" class="form-control">
                        </div> 
                        <div class="form-group">
                            <label for="sumBeforeTax">Suma be PVM</label>
                            <input type="text" id="sumBeforeTaxCreate" class="form-control" value="">
                        </div>
                        <div class="form-group">
                            <label for="tax">Suma</label>
                            <input type="text" id="taxCreate" class="form-control" value="">
                        </div>
                        <div class="form-group">
                            <label for="sumAfterTax">Suma</label>
                            <input type="text" id="sumAfterTaxCreate" class="form-control" value="">
                        </div>
                        <div class="form-group">
                        <button type="button" class="btn btn-outline-success" id="saveNewCashRegisterIncome">Išsaugoti</button>
                        </div>
                    </div>
                </td>
                `;

    const existingInputRow = document.getElementById(`cashRegisterIncomeCreate`);
    if (existingInputRow) {
        existingInputRow.remove();
    }

    document.getElementById('new-register-income-table').insertAdjacentElement('afterend', createInputRow);

    document.getElementById(`saveNewCashRegisterIncome`).addEventListener('click', async () => {
        await saveCashRegisterIncome();
        createInputRow.remove();
    });
}

async function saveCashRegisterIncome() {
    const apiUrl = 'http://localhost:8090/api/pajamos_grynais';
    const cashRegisterIncomeNumber = document.getElementById(`cashRegisterIncomeNumberCreate`).value;
    const cashRegisterIncomeDate = document.getElementById(`cashRegisterIncomeDateCreate`).value;
    const sumBeforeTax = document.getElementById(`sumBeforeTaxCreate`).value;
    const tax = document.getElementById(`taxCreate`).value;
    const sumAfterTax = document.getElementById(`sumAfterTaxCreate`).value;

    const cashRegisterIncome = {
        cashRegisterIncomeNumber,
        cashRegisterIncomeDate,
        sumBeforeTax,
        tax,
        sumAfterTax
    };

    try {
        await axios.post(apiUrl, cashRegisterIncome);
        showAlert(" Kvitas išsaugotas")

        setTimeout(async () => {
            const cashRegisterIncomes = await fetchCashRegisterIncomes();
            applyFilters();
        }, 500);

    } catch (error) {
        console.error('Error saving check:', error);
    }
}

async function deleteCashRegisterIncome(cashRegisterIncomeId) {
    const apiUrl = 'http://localhost:8090/api/pajamos_grynais';
    try {
        await axios.delete(`${apiUrl}/${cashRegisterIncomeId}`);
        showAlert(" Kvitas ištrintas")

        setTimeout(async () => {
            const cashRegisterIncomes = await fetchCashRegisterIncomes();
            applyFilters();
        }, 500);

    } catch (error) {
        console.error('Error deleting check:', error);
    }
}

async function uploadPdf(cashRegisterIncomeId, fileInput) {
    if (!fileInput || !fileInput.files[0]) {
        console.error(`No file input found for order ID ${cashRegisterIncomeId}`);
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        const response = await fetch(`http://localhost:8090/api/pajamos_grynais/${cashRegisterIncomeId}/upload`, {
            method: 'POST',
            body: formData
        });

        const result = await response.text();
        alert(result);

        const cashRegisterIncomes = await fetchCashRegisterIncomes();
        applyFilters();

    } catch (error) {
        console.error('Error during file upload:', error);
        alert('An error occurred while uploading the file.');
    }
}

function handleFileSelect(input, cashRegisterIncomeId) {
    const file = input.files[0];
    if (!file) {
        console.error('No file selected.');
        return;
    }

    const label = document.querySelector(`label[for="${input.id}"]`);
    const fileNameSpan = label.querySelector('.file-name');

    if (fileNameSpan) {
        fileNameSpan.textContent = file.name;
    } else {
        console.error('Span not found for file input ID:', input.id);
    }
}

fetchCashRegisterIncomes().then(() => {
    populateYearFilter();
    applyFilters();
});