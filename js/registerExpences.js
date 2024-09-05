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

document.getElementById('createRegisterExpence').addEventListener('click', () => {
    createCashRegisterExpence();
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

let allCashRegisterExpences = [];
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
    const years = [...new Set(allCashRegisterExpences.map(cashRegisterExpence => new Date(cashRegisterExpence.cashRegisterExpenseDate).getFullYear()))];

    years.sort().forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });
}

function applyFilters() {
    if (allCashRegisterExpences.length === 0) return;

    let filteredCashRegisterExpences = allCashRegisterExpences.filter(cashRegisterExpence => {
        const matchesFilterValue = cashRegisterExpence.cashRegisterExpenseNumber.toLowerCase().includes(filterValue.toLowerCase()) ||
            cashRegisterExpence.invoice.invoiceNumber.toLowerCase().includes(filterValue.toLowerCase()) || cashRegisterExpence.supplier.name.toLowerCase().includes(filterValue.toLowerCase());

        const cashRegisterExpenseDate = new Date(cashRegisterExpence.cashRegisterExpenseDate);
        const cashRegisterExpenseYear = cashRegisterExpenseDate.getFullYear().toString();
        const cashRegisterExpenseMonth = (cashRegisterExpenseDate.getMonth() + 1).toString().padStart(2, '0');

        const matchesYear = !yearFilterValue || cashRegisterExpenseYear === yearFilterValue;
        const matchesMonth = !monthFilterValue || cashRegisterExpenseMonth === monthFilterValue;

        return matchesFilterValue && matchesYear && matchesMonth;
    });

    displayCashRegisterExpences(filteredCashRegisterExpences);
}

async function fetchCashRegisterExpences() {
    try {
        const response = await axios.get("http://localhost:8090/api/islaidos_grynais");
        const cashRegisterExpenses = response.data;

        const invoiceResponse = await axios.get("http://localhost:8090/api/saskaitos");
        const invoices = invoiceResponse.data;

        const supplierResponse = await axios.get("http://localhost:8090/api/tiekejai");
        const suppliers = supplierResponse.data;

        if (!Array.isArray(cashRegisterExpenses)) {
            throw new Error('Invalid data format');
        }

        allCashRegisterExpences = cashRegisterExpenses.map(cashRegisterExpense => {
            const invoice = invoices.find(i => i.id === cashRegisterExpense.invoiceId);
            const supplier = suppliers.find(s => s.id === cashRegisterExpense.supplierId);
            return {
                ...cashRegisterExpense,
                invoice: invoice || { invoiceNumber: 'Unknown' },
                supplier: supplier || { name: 'Unknown' }
            };
        });

        applyFilters();

    } catch (error) {
        console.error('Error fetching orders:', error);
    }
}

function displayCashRegisterExpences(cashRegisterExpenses) {
    const cashRegisterExpensesTable = document.getElementById('register-expences-table');
    cashRegisterExpensesTable.querySelector('tbody').innerHTML = '';

    let totalSum = 0;

    cashRegisterExpenses.forEach((cashRegisterExpense, index) => {
        if (cashRegisterExpense && cashRegisterExpense.id) {
            totalSum += parseFloat(cashRegisterExpense.sum);

            let filename = cashRegisterExpense.pdfFilePath ? cashRegisterExpense.pdfFilePath.split('\\').pop() : 'no-file.pdf';
            filename = filename.replace(/\(/g, '%28').replace(/\)/g, '%29');
            const fileUrl = `http://localhost:8090/uploads/${filename}`;

            const fileInputId = `fileInput-${cashRegisterExpense.id}`;

            const cashRegisterExpenseRow = `
                <tr id="cashRegisterExpense-row-${cashRegisterExpense.id}" class="cashRegisterExpense-row">
                <th scope="row">${index + 1}</th>
                <td>${cashRegisterExpense.pdfFilePath ? `<a href="${fileUrl}" target="_blank"><img src="../pictures/icon.png" alt="PDF Icon" width="16" height="16"></a>` : 'No file'}
                </td>
                <td>${cashRegisterExpense.cashRegisterExpenseNumber}</td>
                <td>${cashRegisterExpense.cashRegisterExpenseDate}</td>
                <td>
                <a href="oneSupplier.html?id=${cashRegisterExpense.supplierId}" data-type="${cashRegisterExpense.id}">
                <span class="truncate">${cashRegisterExpense.supplier.name}</span>
                </a>
                </td>
                <td>${cashRegisterExpense.invoice.invoiceNumber}</td>
                <td>${cashRegisterExpense.sum}</td>
                <td><button id="updateCashRegisterExpense-${cashRegisterExpense.id}" data-id="${cashRegisterExpense.id}">Redaguoti</button></td>
                <td><button id="deleteCashRegisterExpense-${cashRegisterExpense.id}" data-id="${cashRegisterExpense.id}">Ištrinti</button></td>
                <td>
                <form id="uploadForm-${cashRegisterExpense.id}" enctype="multipart/form-data">
                <label for="${fileInputId}" class="custom-file-input">
                <span class="file-name">+</span>
                <input type="file" id="${fileInputId}" name="file" accept="application/pdf" onchange="handleFileSelect(this, ${cashRegisterExpense.id})">
                </label>
                </form>
                </td>
                <td>
                <button type="button" onclick="uploadPdf(${cashRegisterExpense.id}, document.getElementById('${fileInputId}'))">Išsaugoti</button>
                </td>
            </tr>
        `;

            cashRegisterExpensesTable.querySelector('tbody').insertAdjacentHTML('beforeend', cashRegisterExpenseRow);

            const deleteButton = document.getElementById(`deleteCashRegisterExpense-${cashRegisterExpense.id}`);
            deleteButton.addEventListener('click', async () => {
                const confirmation = confirm(`Ar tikrai norite ištrinti kasos orderį: ${cashRegisterExpense.cashRegisterExpenseNumber} ; suma:  ${cashRegisterExpense.sum}?`);
                if (confirmation) {
                    await deleteCashRegisterExpense(cashRegisterExpense.id);
                }
            });

            const updateButton = document.getElementById(`updateCashRegisterExpense-${cashRegisterExpense.id}`);
            updateButton.addEventListener('click', async () => {
                let existingEditInputRow = document.querySelector('tr[id^="inputRow-"]');
                if (existingEditInputRow) {
                    existingEditInputRow.remove();
                }
                const inputRow = document.createElement('tr');
                inputRow.id = `inputRow-${cashRegisterExpense.id}`;
                inputRow.classList.add('cashRegisterExpense-row');

                inputRow.innerHTML = `
                <td colspan="8">
                    <div class="form-container">
                        <div class="form-group">
                            <label for="cashRegisterExpenseNumber">Orderio numeris</label>
                            <input type="text" id="cashRegisterExpenseNumberEdit-${cashRegisterExpense.id}" class="form-control" value="${cashRegisterExpense.cashRegisterExpenseNumber}">
                        </div>      
                        <div class="form-group">
                            <label for="cashRegisterExpenseDate">Orderio data</label>  
                            <input type="text" id="cashRegisterExpenseDateEdit-${cashRegisterExpense.id}" class="form-control" value="${cashRegisterExpense.cashRegisterExpenseDate}">
                        </div> 
                        <div class="form-group">
                            <label for="supplier">Pasirinkite tiekėją</label>
                            <select id="supplierIdEdit-${cashRegisterExpense.id}" class="form-control"></select>
                        </div> 
                        <div class="form-group">
                            <label for="invoice">Priskirkite sąskaitą</label>
                            <select id="invoiceIdEdit-${cashRegisterExpense.id}" class="form-control"></select>
                        </div>
                        <div class="form-group">
                            <label for="sum">Suma</label>
                            <input type="text" id="sumEdit-${cashRegisterExpense.id}" class="form-control" value="${cashRegisterExpense.sum}">
                        </div>
                        <div class="form-group">
                        <button type="button" class="btn btn-outline-success" id="saveCashRegisterExpense-${cashRegisterExpense.id}">Išsaugoti</button>
                        </div>
                    </div>
                </td>
                `;

                const existingInputRow = document.getElementById(`inputRow-${cashRegisterExpense.id}`);
                if (existingInputRow) {
                    existingInputRow.remove();
                }

                document.getElementById(`cashRegisterExpense-row-${cashRegisterExpense.id}`).insertAdjacentElement('afterend', inputRow);

                await populateInvoices(`invoiceIdEdit-${cashRegisterExpense.id}`);
                await populateSuppliers(`supplierIdEdit-${cashRegisterExpense.id}`);

                document.getElementById(`invoiceIdEdit-${cashRegisterExpense.id}`).value = cashRegisterExpense.invoiceId;
                document.getElementById(`supplierIdEdit-${cashRegisterExpense.id}`).value = cashRegisterExpense.supplierId;

                document.getElementById(`saveCashRegisterExpense-${cashRegisterExpense.id}`).addEventListener('click', () => {
                    updateCashRegisterExpense(cashRegisterExpense.id);
                });
            });
        } else {
            console.warn('Invalid order object:', cashRegisterExpense);
        }
    });

    document.getElementById('totalSum').querySelector('span').innerText = `${totalSum.toFixed(2)}`;
}

async function populateSuppliers(selectElementId) {
    try {
        const suppliersResponse = await axios.get('http://localhost:8090/api/tiekejai');
        const suppliers = suppliersResponse.data;

        const supplierSelect = document.getElementById(selectElementId);
        supplierSelect.innerHTML = '<option selected>Tiekėjas</option>';

        suppliers.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier.id;
            option.textContent = supplier.name;
            supplierSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching suppliers:', error);
    }
}

async function populateInvoices(selectElementId) {
    try {
        const invoicesResponse = await axios.get('http://localhost:8090/api/saskaitos');
        const invoices = invoicesResponse.data;

        const invoiceSelect = document.getElementById(selectElementId);
        invoiceSelect.innerHTML = '<option selected>Priklauso sąskaitai</option>';

        invoices.forEach(invoice => {
            const option = document.createElement('option');
            option.value = invoice.id;
            option.textContent = invoice.invoiceNumber;
            invoiceSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
    }
}

async function updateCashRegisterExpense(cashRegisterExpenceId) {
    const apiUrl = 'http://localhost:8090/api/islaidos_grynais';
    const cashRegisterExpenseNumber = document.getElementById(`cashRegisterExpenseNumberEdit-${cashRegisterExpenceId}`).value;
    const cashRegisterExpenseDate = document.getElementById(`cashRegisterExpenseDateEdit-${cashRegisterExpenceId}`).value;
    const supplierId = document.getElementById(`supplierIdEdit-${cashRegisterExpenceId}`).value;
    const invoiceId = document.getElementById(`invoiceIdEdit-${cashRegisterExpenceId}`).value;
    const sum = document.getElementById(`sumEdit-${cashRegisterExpenceId}`).value;

    const cashRegisterExpense = {
        cashRegisterExpenseNumber,
        cashRegisterExpenseDate,
        supplierId,
        invoiceId,
        sum
    };

    try {
        await axios.put(`${apiUrl}/${cashRegisterExpenceId}`, cashRegisterExpense);
        showAlert(" Orderis išsaugotas")

        const cashRegisterExpenses = await fetchCashRegisterExpences();
        applyFilters();

        const inputRow = document.getElementById(`inputRow-${cashRegisterExpenceId}`);
        if (inputRow) {
            inputRow.remove();
        }

    } catch (error) {
        console.error('Error saving order:', error);
    }
}

async function deleteCashRegisterExpense(cashRegisterExpenceId) {
    const apiUrl = 'http://localhost:8090/api/islaidos_grynais';
    try {
        await axios.delete(`${apiUrl}/${cashRegisterExpenceId}`);
        showAlert(" Orderis ištrintas")

        setTimeout(async () => {
            const cashRegisterExpenses = await fetchCashRegisterExpences();
            applyFilters();
        }, 500);

    } catch (error) {
        console.error('Error deleting invoice:', error);
    }
}

async function uploadPdf(cashRegisterExpenceId, fileInput) {
    if (!fileInput || !fileInput.files[0]) {
        console.error(`No file input found for order ID ${cashRegisterExpenceId}`);
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        const response = await fetch(`http://localhost:8090/api/islaidos_grynais/${cashRegisterExpenceId}/upload`, {
            method: 'POST',
            body: formData
        });

        const result = await response.text();
        alert(result);

        const cashRegisterExpenses = await fetchCashRegisterExpences();
        applyFilters();

    } catch (error) {
        console.error('Error during file upload:', error);
        alert('An error occurred while uploading the file.');
    }
}

function handleFileSelect(input, cashRegisterExpenceId) {
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

async function createCashRegisterExpence() {
    if (document.querySelector('.cashRegisterExpenseCreate-row')) return;
    let existingCreateInputRow = document.querySelector('tr[id^="createInputRow-"]');
    if (existingCreateInputRow) {
        existingCreateInputRow.remove();
    }
    const createInputRow = document.createElement('tr');
    createInputRow.classList.add('cashRegisterExpenseCreate-row');

    createInputRow.innerHTML = `
                <td colspan="8">
                    <div class="form-container">
                        <div class="form-group">
                            <label for="cashRegisterExpenseNumber">Orderio numeris</label>
                            <input type="text" id="cashRegisterExpenseNumberCreate" class="form-control">
                        </div>      
                        <div class="form-group">
                            <label for="cashRegisterExpenseDate">Orderio data</label>  
                            <input type="text" id="cashRegisterExpenseDateCreate" class="form-control">
                        </div> 
                        <div class="form-group">
                            <label for="supplier">Pasirinkite tiekėją</label>
                            <select id="supplierIdCreate" class="form-control"></select>
                        </div> 
                        <div class="form-group">
                            <label for="invoice">Priskirkite sąskaitą</label>
                            <select id="invoiceIdCreate" class="form-control"></select>
                        </div>
                        <div class="form-group">
                            <label for="sum">Suma</label>
                            <input type="text" id="sumCreate" class="form-control" value="">
                        </div>
                        <div class="form-group">
                        <button type="button" class="btn btn-outline-success" id="saveNewCashRegisterExpense">Išsaugoti</button>
                        </div>
                    </div>
                </td>
                `;

    const existingInputRow = document.getElementById(`cashRegisterExpenseCreate`);
    if (existingInputRow) {
        existingInputRow.remove();
    }

    document.getElementById('new-register-expences-table').insertAdjacentElement('afterend', createInputRow);

    document.getElementById(`saveNewCashRegisterExpense`).addEventListener('click', async () => {
        await saveCashRegisterExpense();
        createInputRow.remove();
    });

    await populateInvoices(`invoiceIdCreate`);
    await populateSuppliers(`supplierIdCreate`);

    document.getElementById(`saveNewCashRegisterExpense`).addEventListener('click', () => {
        saveCashRegisterExpense();
    });
}

async function saveCashRegisterExpense() {
    const apiUrl = 'http://localhost:8090/api/islaidos_grynais';
    const cashRegisterExpenseNumber = document.getElementById(`cashRegisterExpenseNumberCreate`).value;
    const cashRegisterExpenseDate = document.getElementById(`cashRegisterExpenseDateCreate`).value;
    const supplierId = document.getElementById(`supplierIdCreate`).value;
    const invoiceId = document.getElementById(`invoiceIdCreate`).value;
    const sum = document.getElementById(`sumCreate`).value;

    const cashRegisterExpense = {
        cashRegisterExpenseNumber,
        cashRegisterExpenseDate,
        supplierId,
        invoiceId,
        sum
    };

    try {
        await axios.post(apiUrl, cashRegisterExpense);
        showAlert(" Orderis išsaugotas")

        setTimeout(async () => {
            const cashRegisterExpenses = await fetchCashRegisterExpences();
            applyFilters();
        }, 500);

    } catch (error) {
        console.error('Error saving order:', error);
    }
}

fetchCashRegisterExpences().then(() => {
    populateYearFilter();
    applyFilters();
});