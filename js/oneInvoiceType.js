fetchTypeInvoices();

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
        const invoiceType = types.find(type => type.id == invoice.invoiceTypeId);
        const invoiceTypeName = invoiceType ? invoiceType.name : 'Unknown';

        const invoiceSupplier = suppliers.find(supplier => supplier.id == invoice.supplierId);
        const invoiceSupplierName = invoiceSupplier ? invoiceSupplier.name : 'Unknown';

        const invoiceRow = `
              <tr id="invoice-row-${invoice.id}">
                  <th scope="row">${index + 1}</th>
                  <td><a href="oneInvoiceType.html?id=${invoice.invoiceTypeId}" data-type="${invoice.invoiceTypeId}">${invoiceTypeName}</a></td>
                  <td>${invoice.invoiceNumber}</td>
                  <td>${invoice.invoiceDate}</td>
                  <td><a href="oneSupplier.html?id=${invoice.supplierId}" data-type="${invoice.id}">${invoiceSupplierName}</a></td>
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
    console.error('Error fetching supplier:', error);
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