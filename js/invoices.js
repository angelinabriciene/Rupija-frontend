if (window.location.href.includes("info=d")) {
    showAlert(" Sąskaita išsaugota");
}

if (window.location.href.includes("info=u")) {
    showAlert(" Sąskaita ištrinta");
}

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

let allInvoices = [];
let filterValue = '';
let yearFilterValue = '';
let monthFilterValue = '';

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

function getCurrentYearAndMonth() {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return { year, month };
}

function populateYearFilter() {
    const yearSelect = document.getElementById('year-filter');
    const years = [...new Set(allInvoices.map(invoice => new Date(invoice.invoiceDate).getFullYear()))];

    years.sort().forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });
}

function applyFilters() {
    if (allInvoices.length === 0) return;

    let filteredInvoices = allInvoices.filter(invoice => {
        const matchesFilterValue = invoice.invoiceNumber.toLowerCase().includes(filterValue.toLowerCase()) ||
            (invoice.supplierId && invoice.supplier.name.toLowerCase().includes(filterValue.toLowerCase()));
        
        const invoiceDate = new Date(invoice.invoiceDate);
        const invoiceYear = invoiceDate.getFullYear().toString();
        const invoiceMonth = (invoiceDate.getMonth() + 1).toString().padStart(2, '0');

        const matchesYear = !yearFilterValue || invoiceYear === yearFilterValue;
        const matchesMonth = !monthFilterValue || invoiceMonth === monthFilterValue;

        return matchesFilterValue && matchesYear && matchesMonth;
    });

    displayInvoices(filteredInvoices);
}

async function fetchInvoices() {
    try {
        const response = await axios.get("http://localhost:8090/api/saskaitos");
        const invoices = response.data;

        const typeResponse = await axios.get("http://localhost:8090/api/tipai");
        const types = typeResponse.data;

        const supplierResponse = await axios.get("http://localhost:8090/api/tiekejai");
        const suppliers = supplierResponse.data;

        if (!Array.isArray(invoices)) {
            throw new Error('Invalid data format');
        }

        allInvoices = invoices.map(invoice => {
            const type = types.find(t => t.id === invoice.invoiceTypeId);
            const supplier = suppliers.find(s => s.id === invoice.supplierId);
            return {
                ...invoice,
                type: type || { name: 'Unknown' },
                supplier: supplier || { name: 'Unknown' }
            };
        });

        applyFilters();

    } catch (error) {
        console.error('Error fetching invoices:', error);
    }
}

function displayInvoices(invoices) {
    const invoiceTable = document.getElementById('invoice-table2');
    invoiceTable.querySelector('tbody').innerHTML = '';

    invoices.forEach((invoice, index) => {
        if (invoice && invoice.id) { 
            const invoiceRow = `
                <tr id="invoice-row-${invoice.id}">
                    <th scope="row">${index + 1}</th>
                    <td>
                    <input type="checkbox" ${invoice.unpaid ? '' : 'checked'} 
                        onchange="updateInvoicePaymentStatus(${invoice.id}, this.checked)">
                    </td>
                    <td><a href="oneInvoiceType.html?id=${invoice.invoiceTypeId}" data-type="${invoice.invoiceTypeId}">${invoice.type.name}</a></td>
                    <td>${invoice.invoiceNumber}</td>
                    <td>${invoice.invoiceDate}</td>
                    <td><a href="oneSupplier.html?id=${invoice.supplierId}" data-type="${invoice.id}">${invoice.supplier.name}</a></td>
                    <td>${invoice.sumBeforeTax}</td>
                    <td>${invoice.tax}</td>
                    <td>${invoice.sumAfterTax}</td>
                    <td><button id="updateInvoice-${invoice.id}" data-id="${invoice.id}">Redaguoti</button></td>
                    <td><button id="deleteInvoice-${invoice.id}" data-id="${invoice.id}">Ištrinti</button></td>
                </tr>
            `;
            invoiceTable.querySelector('tbody').insertAdjacentHTML('beforeend', invoiceRow);

            const deleteButton = document.getElementById(`deleteInvoice-${invoice.id}`);
            deleteButton.addEventListener('click', async () => {
                const confirmation = confirm(`Ar tikrai norite ištrinti sąskaitą: ${invoice.invoiceNumber} ; data:  ${invoice.invoiceDate}?`);
                if (confirmation) {
                    await deleteInvoice(invoice.id);
                }
            });

            const updateButton = document.getElementById(`updateInvoice-${invoice.id}`);
            updateButton.addEventListener('click', async () => {
                const inputRow = document.createElement('tr');
                inputRow.id = `inputRow-${invoice.id}`;
                inputRow.innerHTML = `
                    <td colspan="8">
                        <select id="invoiceTypeIdEdit-${invoice.id}" class="form-control"></select>
                        <input type="text" id="invoiceNumberEdit-${invoice.id}" class="form-control" value="${invoice.invoiceNumber}">
                        <input type="text" id="invoiceDateEdit-${invoice.id}" class="form-control" value="${invoice.invoiceDate}">
                        <select id="supplierIdEdit-${invoice.id}" class="form-control"></select>
                        <input type="text" id="sumBeforeTaxEdit-${invoice.id}" class="form-control" value="${invoice.sumBeforeTax}">
                        <input type="text" id="taxEdit-${invoice.id}" class="form-control" value="${invoice.tax}">
                        <input type="text" id="sumAfterTaxEdit-${invoice.id}" class="form-control" value="${invoice.sumAfterTax}">
                        <button type="button" class="btn btn-outline-success" id="saveInvoice-${invoice.id}">Išsaugoti</button>
                    </td>
                `;

                const existingInputRow = document.getElementById(`inputRow-${invoice.id}`);
                if (existingInputRow) {
                    existingInputRow.remove();
                }

                document.getElementById(`invoice-row-${invoice.id}`).insertAdjacentElement('afterend', inputRow);

                await populateTypes(`invoiceTypeIdEdit-${invoice.id}`);
                await populateSuppliers(`supplierIdEdit-${invoice.id}`);

                document.getElementById(`invoiceTypeIdEdit-${invoice.id}`).value = invoice.invoiceTypeId;
                document.getElementById(`supplierIdEdit-${invoice.id}`).value = invoice.supplierId;

                document.getElementById(`saveInvoice-${invoice.id}`).addEventListener('click', () => {
                    updateInvoice(invoice.id);
                });
            });
        } else {
            console.warn('Invalid invoice object:', invoice);
        }
    });
}

async function populateTypes(selectElementId) {
    try {
        const typesResponse = await axios.get('http://localhost:8090/api/tipai');
        const types = typesResponse.data;

        const invoiceTypeSelect = document.getElementById(selectElementId);
        invoiceTypeSelect.innerHTML = '<option selected>Sąskaitos tipas</option>';

        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name;
            invoiceTypeSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching types:', error);
    }
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

async function deleteInvoice(invoiceId) {
    const apiUrl = 'http://localhost:8090/api/saskaitos';
    try {
        await axios.delete(`${apiUrl}/${invoiceId}`);
        window.location.href = "http://127.0.0.1:5500/views/invoices.html?info=u";
    } catch (error) {
        console.error('Error deleting invoice:', error);
    }
}

async function updateInvoice(invoiceId) {
    const apiUrl = 'http://localhost:8090/api/saskaitos';
    const invoiceTypeId = document.getElementById(`invoiceTypeIdEdit-${invoiceId}`).value;
    const invoiceNumber = document.getElementById(`invoiceNumberEdit-${invoiceId}`).value;
    const invoiceDate = document.getElementById(`invoiceDateEdit-${invoiceId}`).value;
    const supplierId = document.getElementById(`supplierIdEdit-${invoiceId}`).value;
    const sumBeforeTax = document.getElementById(`sumBeforeTaxEdit-${invoiceId}`).value;
    const tax = document.getElementById(`taxEdit-${invoiceId}`).value;
    const sumAfterTax = document.getElementById(`sumAfterTaxEdit-${invoiceId}`).value;

    const invoice = {
        invoiceTypeId,
        invoiceNumber,
        invoiceDate,
        supplierId,
        sumBeforeTax,
        tax,
        sumAfterTax
    };

    try {
        await axios.put(`${apiUrl}/${invoiceId}`, invoice);
        window.location.href = "http://127.0.0.1:5500/views/invoices.html?info=d";
    } catch (error) {
        console.error('Error saving invoice:', error);
    }
}

async function updateInvoicePaymentStatus(invoiceId, isPaid) {
    const apiUrl = 'http://localhost:8090/api/saskaitos';
    console.log(invoiceId);
    
    try {
      const response = await axios.get(`${apiUrl}/${invoiceId}`);
      const existingInvoice = response.data;
  
      const invoice = {
        ...existingInvoice,
        unpaid: !isPaid,
      };
  
      await axios.put(`${apiUrl}/${invoiceId}`, invoice);
  
      console.log('Invoice payment status updated successfully');
      alert('Sąskaita apmokėta');
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Sąskaitos pažymėti kaip apmokėtos nepavyko, bandykite dar karą');
    }
  }

fetchInvoices().then(() => {
    populateYearFilter();
    applyFilters();
});