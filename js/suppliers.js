fetchSuppliers();

if (window.location.href.includes("info=d")) {
    showAlert(" Tiekėjas atnaujintas");
}

if (window.location.href.includes("info=u")) {
    showAlert(" Tiekėjas išsaugotas");
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

async function fetchSuppliers() {
    try {
        const response = await axios.get("http://localhost:8090/api/tiekejai");
        const suppliers = response.data;

        if (!Array.isArray(suppliers)) {
            throw new Error('Invalid data format');
        }

        const supplierTable = document.getElementById('supplier-table');
        supplierTable.querySelector('tbody').innerHTML = '';

        suppliers.forEach((supplier, index) => {
            if (supplier && supplier.id && supplier.name) {
                const supplierRow = `
                    <tr id="supplier-row-${supplier.id}">
                        <th scope="row">${index + 1}</th>
                        <td><a href="oneSupplier.html?id=${supplier.id}" data-type="${supplier.id}">${supplier.name}</a></td>
                        <td>${supplier.supplierCode}</td>
                        <td>${supplier.supplierTaxCode}</td>
                        <td>${supplier.adress}</td>
                        <td>${supplier.supplierBankAcc}</td>
                        <td><button id="updateSupplier-${supplier.id}" data-id="${supplier.id}">Redaguoti</button></td>
                    </tr>
                `;
                supplierTable.querySelector('tbody').insertAdjacentHTML('beforeend', supplierRow);
        
                const updateButton = document.getElementById(`updateSupplier-${supplier.id}`);
                updateButton.addEventListener('click', async () => {
                    let existingEditInputRow = document.querySelector('tr[id^="inputRow-"]');
                if (existingEditInputRow) {
                    existingEditInputRow.remove();
                }
                    const inputRow = document.createElement('tr');
                    inputRow.id = `inputRow-${supplier.id}`;
                    inputRow.classList.add('supplier-row');

                    inputRow.innerHTML = `
                        <td colspan="8">
                            <div class="form-container">
                                <label for="nameEdit-${supplier.id}">Įmonės pavadinimas:</label>
                                <input type="text" id="nameEdit-${supplier.id}" class="form-control" value="${supplier.name}">
                                
                                <label for="supplierCodeEdit-${supplier.id}">Įmonės kodas:</label>
                                <input type="text" id="supplierCodeEdit-${supplier.id}" class="form-control" value="${supplier.supplierCode}">
                                
                                <label for="supplierTaxCodeEdit-${supplier.id}">PVM mokėtojo kodas:</label>
                                <input type="text" id="supplierTaxCodeEdit-${supplier.id}" class="form-control" value="${supplier.supplierTaxCode}">
                                
                                <label for="supplierAdressEdit-${supplier.id}">Adresas:</label>
                                <input type="text" id="supplierAdressEdit-${supplier.id}" class="form-control" value="${supplier.adress}">
                                
                                <label for="supplierBankAccEdit-${supplier.id}">Banko sąskaita:</label>
                                <input type="text" id="supplierBankAccEdit-${supplier.id}" class="form-control" value="${supplier.supplierBankAcc}">
                                
                                <button type="button" class="btn btn-outline-success" id="saveSupplier-${supplier.id}">Išsaugoti</button>
                            </div>
                        </td>
                    `;
        
                    const existingInputRow = document.getElementById(`inputRow-${supplier.id}`);
                    if (existingInputRow) {
                        existingInputRow.remove();
                    }
        
                    document.getElementById(`supplier-row-${supplier.id}`).insertAdjacentElement('afterend', inputRow);
        
                    document.getElementById(`saveSupplier-${supplier.id}`).addEventListener('click', () => {
                        updateSupplier(supplier.id);
                    });
                });
            } else {
                console.warn('Invalid supplier object:', supplier);
            }
        });

    } catch (error) {
        console.error('Error fetching suppliers:', error);
    }
}

async function updateSupplier(supplierId) {
    const apiUrl = 'http://localhost:8090/api/tiekejai';
    const name = document.getElementById(`nameEdit-${supplierId}`).value;
    const supplierCode = document.getElementById(`supplierCodeEdit-${supplierId}`).value;
    const supplierTaxCode = document.getElementById(`supplierTaxCodeEdit-${supplierId}`).value;
    const adress = document.getElementById(`supplierAdressEdit-${supplierId}`).value;
    const supplierBankAcc = document.getElementById(`supplierBankAccEdit-${supplierId}`).value;

    const supplier = {
        name,
        supplierCode,
        supplierTaxCode,
        adress,
        supplierBankAcc
    };

    try {
        await axios.put(`${apiUrl}/${supplierId}`, supplier);
        showAlert(" Tiekėjas išsaugotas")

        const suppliers = await fetchSuppliers();

        const inputRow = document.getElementById(`inputRow-${supplierId}`);
        if (inputRow) {
            inputRow.remove();
        }

    } catch (error) {
        console.error('Error saving supplier:', error);
    }
}