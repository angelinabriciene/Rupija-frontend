try {
    document.getElementById("submitInvoice").addEventListener("click", function (event) {
        saveInvoice();
        event.preventDefault();
    });
} catch (Exception) { }

document.getElementById("addNewSupplier").addEventListener("click", function (event) {
    addSupplier();
});

document.getElementById("submitInvoice").addEventListener("click", async function (event) {
    event.preventDefault();

    let supplierId = document.getElementById('supplier').value;

    const supplierNameInput = document.getElementById('supplierName');

    if (supplierNameInput && supplierNameInput.value.trim() !== '') {
        try {
            const newSupplierId = await saveSupplier(); 
            if (newSupplierId) {
                supplierId = newSupplierId;
            }
        } catch (error) {
            console.error('Error occurred while saving supplier:', error);
            return;
        }
    }

    if (supplierId && supplierId !== "Tiekėjas") { 
        saveInvoice(supplierId); 
    } else {
        console.error('Cannot save invoice: invalid supplier ID');
    }
});

window.onload = function () {
    populateSuppliers();
    populateTypes();
}

async function populateTypes() {
    try {
        const typesResponse = await axios.get('http://localhost:8090/api/tipai');
        const types = typesResponse.data;

        const invoiceTypeSelect = document.getElementById('invoiceType');
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

async function populateSuppliers() {
    try {
        const suppliersResponse = await axios.get('http://localhost:8090/api/tiekejai');
        const suppliers = suppliersResponse.data;

        const supplierSelect = document.getElementById('supplier');
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

async function saveInvoice(supplierId) {
    const apiUrl = 'http://localhost:8090/api/saskaitos';
    const invoiceTypeId = document.getElementById('invoiceType').value;
    const invoiceNumber = document.getElementById('invoiceNumber').value;
    const invoiceDate = document.getElementById('invoiceDate').value;
    const sumBeforeTax = document.getElementById('sumBeforeTax').value;
    const tax = document.getElementById('tax').value;
    const sumAfterTax = document.getElementById('sumAfterTax').value;

    if (!supplierId || supplierId === "Tiekėjas") {
        console.error('Invalid supplier ID');
        return;
    }

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
        await axios.post(apiUrl, invoice);
        window.location.href = "http://127.0.0.1:5500/views/invoices.html?info=d";
    } catch (error) {
        console.error('Error saving invoice:', error);
    }
}

async function addSupplier() {
    const inputRow = document.createElement('tr');
    inputRow.classList.add('supplier-row');

    inputRow.innerHTML = `
        <td colspan="8">
            <div class="form-group">
            <label for="supplierName">Įmonės pavadinimas</label>
            <input type="text" id="supplierName" class="form-control"></div>
            </div>
            <div class="form-group">
            <label for="supplierCode">Įmonės kodas</label>
            <input type="text" id="supplierCode" class="form-control">
            </div>      
            <div class="form-group">
            <label for="supplierTaxCode">Įmonės PVM mokėtojo kodas</label>  
            <input type="text" id="supplierTaxCode" class="form-control">
            </div> 
            <div class="form-group">
            <label for="supplierBankAcc">Banko sąskaita</label>
            <input type="text" id="supplierBankAcc" class="form-control"></input>
            </div> 
            <div class="form-group">
            <label for="supplierAddress">Įmonės adresas</label>
            <input type="text" id="supplierAddress" class="form-control">
            </div>
        </td>
    `;

    const existingInputRow = document.getElementById(`inputRow`);
    if (existingInputRow) {
        existingInputRow.remove();
    }

    document.getElementById('supplier-table').appendChild(inputRow);
}

async function saveSupplier() {
    const apiUrl = 'http://localhost:8090/api/tiekejai';
    const name = document.getElementById('supplierName').value;
    const supplierCode = document.getElementById('supplierCode').value;
    const supplierTaxCode = document.getElementById('supplierTaxCode').value;
    const supplierBankAcc = document.getElementById('supplierBankAcc').value;
    const adress = document.getElementById('supplierAddress').value;

    const supplier = {
        name,
        supplierCode,
        supplierTaxCode,
        supplierBankAcc,
        adress
    };

    try {
        const response = await axios.post(apiUrl, supplier);
        const newSupplierId = response.data.id;

        if (!newSupplierId) {
            throw new Error('Failed to get new supplier ID from response');
        }
        return newSupplierId;

    } catch (error) {
        console.error('Error saving supplier:', error);
        throw error;
    }
}