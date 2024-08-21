fetchInvoices();

if (window.location.href.includes("info=d")) {
    showAlert(" Sąskaita išsaugota");
}

if (window.location.href.includes("info=u")) {
    showAlert(" Sąskaita ištrinta");
}

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

async function fetchInvoices() {
    try {
        const response = await axios.get("http://localhost:8090/api/saskaitos");
        const invoices = response.data;

        if (!Array.isArray(invoices)) {
            throw new Error('Invalid data format');
        }

        const invoiceTable = document.getElementById('invoice-table');
        invoiceTable.querySelector('tbody').innerHTML = '';

        invoices.forEach((invoice, index) => {
            if (invoice && invoice.id) {
                const invoiceRow = `
                    <tr id="invoice-row-${invoice.id}">
                        <th scope="row">${index + 1}</th>
                        <td><a href="oneInvoiceType.html?id=${invoice.id}" data-type="${invoice.id}">${invoice.invoiceTypeId}</a></td>
                        <td>${invoice.invoiceNumber}</td>
                        <td>${invoice.invoiceDate}</td>
                        <td><a href="oneSupplier.html?id=${invoice.id}" data-type="${invoice.id}">${invoice.supplierId}</a></td>
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
                    await deleteInvoice(invoice.id);
                });
        
                const updateButton = document.getElementById(`updateInvoice-${invoice.id}`);
                updateButton.addEventListener('click', async () => {
                    const inputRow = document.createElement('tr');
                    inputRow.id = `inputRow-${invoice.id}`;
                    inputRow.innerHTML = `
                        <td colspan="8">
                            <input type="text" id="invoiceTypeIdEdit-${invoice.id}" class="form-control" value="${invoice.invoiceTypeId}">
                            <input type="text" id="invoiceNumberEdit-${invoice.id}" class="form-control" value="${invoice.invoiceNumber}">
                            <input type="text" id="invoiceDateEdit-${invoice.id}" class="form-control" value="${invoice.invoiceDate}">

                            <input type="text" id="supplierIdEdit-${invoice.id}" class="form-control" value="${invoice.supplierId}">

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
        
                    document.getElementById(`saveInvoice-${invoice.id}`).addEventListener('click', () => {
                        updateInvoice(invoice.id);
                    });
                });
            } else {
                console.warn('Invalid invoice object:', invoice);
            }
        });

    } catch (error) {
        console.error('Error fetching invoices:', error);
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