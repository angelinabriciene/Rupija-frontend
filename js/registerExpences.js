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
            (invoice.invoiceNumber && invoice.supplier.name.toLowerCase().includes(filterValue.toLowerCase()));

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
                            <input type="text" id="sum-${cashRegisterExpense.id}" class="form-control" value="${cashRegisterExpense.sum}">
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

fetchCashRegisterExpences().then(() => {
    populateYearFilter();
    applyFilters();
});