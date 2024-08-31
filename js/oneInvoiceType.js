fetchTypeInvoices();

document.getElementById('downloadPdf').addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
  });
  const headerText = document.getElementById('typeName').textContent;
  const sumText = document.getElementById('total').textContent;
  const sumBeforeTaxText = document.getElementById('totalSumBeforeTax').textContent;
  const taxText = document.getElementById('totalSumTax').textContent;
  const sumAfterTaxText = document.getElementById('totalSumAfterTax').textContent;


  const title = `${headerText}`;
  doc.setFont("Helvetica", "normal");
  doc.text(title.trim(), 14, 10);

  doc.autoTable({
    html: '#invoice-table',
    startY: 20,
    headStyles: { fillColor: [41, 128, 185] },
    styles: { cellPadding: 1.5, fontSize: 10 },
    margin: { top: 10 },
    columnStyles: {
      8: { cellWidth: 0 },
    },
    didParseCell: function (data) {
      if (data.column.index === 8) {
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

async function fetchTypeInvoices() {
  const invoiceTypeId = new URLSearchParams(window.location.search).get('id');

  let totalSumBeforeTax = 0;
  let totalTax = 0;
  let totalSumAfterTax = 0;

  try {
    const response = await axios.get(`http://localhost:8090/api/saskaitos`);
    const invoices = response.data;

    const typeResponse = await axios.get("http://localhost:8090/api/tipai");
    const types = typeResponse.data;

    const supplierResponse = await axios.get("http://localhost:8090/api/tiekejai");
    const suppliers = supplierResponse.data;

    const typeName = document.getElementById('typeName');
    const selectedName = types.find(type => type.id == invoiceTypeId);
    typeName.textContent = selectedName.name;

    const filteredInvoices = invoices.filter(invoice => invoice.invoiceTypeId == invoiceTypeId);
    console.log("Filtered Invoices:", filteredInvoices);

    if (!Array.isArray(filteredInvoices)) {
      throw new Error('Invalid data format');
    }

    const invoiceTable = document.getElementById('invoice-table');
    invoiceTable.querySelector('tbody').innerHTML = '';

    filteredInvoices.forEach((invoice, index) => {
      if (invoice && invoice.id) {
        totalSumBeforeTax += parseFloat(invoice.sumBeforeTax);
        totalTax += parseFloat(invoice.tax);
        totalSumAfterTax += parseFloat(invoice.sumAfterTax);
        const invoiceType = types.find(type => type.id == invoice.invoiceTypeId);
        const invoiceTypeName = invoiceType ? invoiceType.name : 'Unknown';

        const invoiceSupplier = suppliers.find(supplier => supplier.id == invoice.supplierId);
        const invoiceSupplierName = invoiceSupplier ? invoiceSupplier.name : 'Unknown';

        const invoiceRow = `
          <tr id="invoice-row-${invoice.id}">
          <th scope="row">${index + 1}</th>
          <td>
          <input type="checkbox" ${invoice.unpaid ? '' : 'checked'} 
            onchange="updateInvoicePaymentStatus(${invoice.id}, this.checked)">
          <span>${invoice.unpaid ? '-' : 'apmokėta'}</span>
          </td>
          <td>${invoice.invoiceNumber}</td>
          <td>${invoice.invoiceDate}</td>
          <td>
          <a href="oneSupplier.html?id=${invoice.supplierId}" data-type="${invoice.id}">
          <span class="truncate">${invoiceSupplierName}</span>
          </a>
          </td>
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

  } catch (error) {
    console.error('Error fetching supplier:', error);
  }

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
    fetchTypeInvoices();
    showAlert(" Sąskaita ištrinta")
  } catch (error) {
    console.error('Error deleting invoice:', error);
  }
}

async function updateInvoice(invoiceId) {
  const apiUrl = 'http://localhost:8090/api/saskaitos';
  const invoiceSupplierId = new URLSearchParams(window.location.search).get('id');
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
    fetchTypeInvoices();
    showAlert(" Sąskaita išsaugota")
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
  } catch (error) {
    console.error('Error updating payment status:', error);
    alert('Sąskaitos pažymėti nepavyko, bandykite dar karą');
  }
}