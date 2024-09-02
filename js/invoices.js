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

document.getElementById('paid-filter').addEventListener('change', (event) => {
    paidFilterValue = event.target.value;
    applyFilters();
});

document.addEventListener('DOMContentLoaded', () => {
    const { year, month } = getCurrentYearAndMonth();
    yearFilterValue = year;
    monthFilterValue = month;
    document.getElementById('year-filter').value = yearFilterValue;
    document.getElementById('month-filter').value = monthFilterValue;
});

document.getElementById('downloadPdf').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
    });
    const headerText = document.querySelector('.col-10 h3').textContent;
    const sumText = document.getElementById('total').textContent;
    const sumBeforeTaxText = document.getElementById('totalSumBeforeTax').textContent;
    const taxText = document.getElementById('totalSumTax').textContent;
    const sumAfterTaxText = document.getElementById('totalSumAfterTax').textContent;


    const title = `${headerText} ${yearFilterValue || ''}-${monthFilterValue || ''}`;
    doc.setFont("Helvetica", "normal");
    doc.text(title.trim(), 14, 10);

    doc.autoTable({
        html: '#invoice-table2',
        startY: 20,
        headStyles: { fillColor: [41, 128, 185] },
        styles: { cellPadding: 1.5, fontSize: 10 },
        margin: { top: 10 },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 0 },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 'auto' },
            4: { cellWidth: 'auto' },
            5: { cellWidth: 'auto' },
            6: { cellWidth: 'auto' },
            7: { cellWidth: 'auto' },
            8: { cellWidth: 'auto' },
            9: { cellWidth: 'auto' },
            10: { cellWidth: 0 },
            11: { cellWidth: 0 },
            12: { cellWidth: 0 },
            13: { cellWidth: 0 },
            14: { cellWidth: 0 },
        },
        didParseCell: function (data) {
            if (data.column.index === 1 || data.column.index > 9) {
                data.cell.text = '';
            }
        }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`${sumText}`, 14, finalY);
    doc.text(`${sumBeforeTaxText}`, 14, finalY + 10);
    doc.text(`${taxText}`, 14, finalY + 20);
    doc.text(`${sumAfterTaxText}`, 14, finalY + 30);

    doc.save('invoices.pdf');
});

let allInvoices = [];
let filterValue = '';
let yearFilterValue = '';
let monthFilterValue = '';
let paidFilterValue = '';

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
        const matchesStatus = !paidFilterValue || (paidFilterValue === 'paid' ? !invoice.unpaid : invoice.unpaid);

        return matchesFilterValue && matchesYear && matchesMonth && matchesStatus;
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

function handleFileSelect(input, invoiceId) {
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

function displayInvoices(invoices) {
    const invoiceTable = document.getElementById('invoice-table2');
    invoiceTable.querySelector('tbody').innerHTML = '';

    let totalSumBeforeTax = 0;
    let totalTax = 0;
    let totalSumAfterTax = 0;

    invoices.forEach((invoice, index) => {
        if (invoice && invoice.id) {
            totalSumBeforeTax += parseFloat(invoice.sumBeforeTax);
            totalTax += parseFloat(invoice.tax);
            totalSumAfterTax += parseFloat(invoice.sumAfterTax);

            let filename = invoice.pdfFilePath ? invoice.pdfFilePath.split('\\').pop() : 'no-file.pdf';
            filename = filename.replace(/\(/g, '%28').replace(/\)/g, '%29');
            const fileUrl = `http://localhost:8090/uploads/${filename}`;

            const fileInputId = `fileInput-${invoice.id}`;

            const invoiceRow = `
                <tr id="invoice-row-${invoice.id}" class="invoice-row">
                <th scope="row">${index + 1}</th>
                <td>${invoice.pdfFilePath ? `<a href="${fileUrl}" target="_blank"><img src="../pictures/icon.png" alt="PDF Icon" width="16" height="16"></a>` : 'No file'}
                </td>
                <td>
                <input type="checkbox" ${invoice.unpaid ? '' : 'checked'} onchange="updateInvoicePaymentStatus(${invoice.id}, this.checked)">
                <span>${invoice.unpaid ? '-' : 'apmokėta'}</span>
                </td>
                <td>
                <a href="oneInvoiceType.html?id=${invoice.invoiceTypeId}" data-type="${invoice.invoiceTypeId}">
                <span class="truncate">${invoice.type.name}</span>
                </a>
                </td>
                <td>${invoice.invoiceNumber}</td>
                <td>${invoice.invoiceDate}</td>
                <td>
                <a href="oneSupplier.html?id=${invoice.supplierId}" data-type="${invoice.id}">
                <span class="truncate">${invoice.supplier.name}</span>
                </a>
                </td>
                <td>${invoice.sumBeforeTax}</td>
                <td>${invoice.tax}</td>
                <td>${invoice.sumAfterTax}</td>
                <td><button id="updateInvoice-${invoice.id}" data-id="${invoice.id}">Redaguoti</button></td>
                <td><button id="deleteInvoice-${invoice.id}" data-id="${invoice.id}">Ištrinti</button></td>
                <td>
                <form id="uploadForm-${invoice.id}" enctype="multipart/form-data">
                <label for="${fileInputId}" class="custom-file-input">
                <span class="file-name">+</span>
                <input type="file" id="${fileInputId}" name="file" accept="application/pdf" onchange="handleFileSelect(this, ${invoice.id})">
                </label>
                </form>
                </td>
                <td>
                <button type="button" onclick="uploadPdf(${invoice.id}, document.getElementById('${fileInputId}'))">Išsaugoti</button>
                </td>
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
                let existingEditInputRow = document.querySelector('tr[id^="inputRow-"]');
                if (existingEditInputRow) {
                    existingEditInputRow.remove();
                }
                const inputRow = document.createElement('tr');
                inputRow.id = `inputRow-${invoice.id}`;
                inputRow.classList.add('invoice-row');

                inputRow.innerHTML = `
                <td colspan="8">
                    <div class="form-container">
                        <div class="form-group">
                            <label for="invoiceType">Sąskaitos tipas</label>
                            <select id="invoiceTypeIdEdit-${invoice.id}" class="form-control"></select>
                        </div>
                        <div class="form-group">
                            <label for="invoiceNumber">Sąskaitos numeris</label>
                            <input type="text" id="invoiceNumberEdit-${invoice.id}" class="form-control" value="${invoice.invoiceNumber}">
                        </div>      
                        <div class="form-group">
                            <label for="invoiceDate">Sąskaitos data</label>  
                            <input type="text" id="invoiceDateEdit-${invoice.id}" class="form-control" value="${invoice.invoiceDate}">
                        </div> 
                        <div class="form-group">
                            <label for="supplier">Pasirinkite tiekėją</label>
                            <select id="supplierIdEdit-${invoice.id}" class="form-control"></select>
                        </div> 
                        <div class="form-group">
                            <label for="sumBeforeTax">Suma be PVM</label>
                            <input type="text" id="sumBeforeTaxEdit-${invoice.id}" class="form-control" value="${invoice.sumBeforeTax}">
                        </div>
                        <div class="form-group">
                            <label for="tax">PVM</label>
                            <input type="text" id="taxEdit-${invoice.id}" class="form-control" value="${invoice.tax}">
                        </div>
                        <div class="form-group">
                            <label for="sumAfterTax">Suma su PVM</label>
                            <input type="text" id="sumAfterTaxEdit-${invoice.id}" class="form-control" value="${invoice.sumAfterTax}">
                        </div>
                        <div class="form-group">
                            <input type="checkbox" id="unpaidCheckbox-${invoice.id}" class="check-box" ${invoice.unpaid ? '' : 'checked'} onchange="updateInvoicePaymentStatus(${invoice.id}, this.checked)">
                            <span>${invoice.unpaid ? '-' : 'apmokėta'}</span>
                        </div>
                        <div class="form-group">
                        <button type="button" class="btn btn-outline-success" id="saveInvoice-${invoice.id}">Išsaugoti</button>
                        </div>
                    </div>
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

    document.getElementById('totalSumBeforeTax').querySelector('span').innerText = `${totalSumBeforeTax.toFixed(2)}`;
    document.getElementById('totalSumTax').querySelector('span').innerText = `${totalTax.toFixed(2)}`;
    document.getElementById('totalSumAfterTax').querySelector('span').innerText = `${totalSumAfterTax.toFixed(2)}`;
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
    const isPaid = document.getElementById(`unpaidCheckbox-${invoiceId}`).checked;
    const unpaid = !isPaid;
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
        sumAfterTax,
        unpaid
    };

    try {
        await axios.put(`${apiUrl}/${invoiceId}`, invoice);
        showAlert(" Sąskaita išsaugota")

        const invoices = await fetchInvoices();
        applyFilters();

        const inputRow = document.getElementById(`inputRow-${invoiceId}`);
        if (inputRow) {
            inputRow.remove();
        }
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
        alert('Mokėjimas pakoreguotas');
        const invoices = await fetchInvoices();
        applyFilters();
    } catch (error) {
        console.error('Error updating payment status:', error);
        alert('Sąskaitos pažymėti nepavyko, bandykite dar karą');
    }
}

async function uploadPdf(invoiceId, fileInput) {
    if (!fileInput || !fileInput.files[0]) {
        console.error(`No file input found for invoice ID ${invoiceId}`);
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        const response = await fetch(`http://localhost:8090/api/saskaitos/${invoiceId}/upload`, {
            method: 'POST',
            body: formData
        });

        const result = await response.text();
        alert(result);
        const invoices = await fetchInvoices();
        applyFilters();
    } catch (error) {
        console.error('Error during file upload:', error);
        alert('An error occurred while uploading the file.');
    }
}

fetchInvoices().then(() => {
    populateYearFilter();
    applyFilters();
});