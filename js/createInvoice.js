try {
    document.getElementById("submitInvoice").addEventListener("click", function (event) {
        saveInvoice();
        event.preventDefault();
    });
} catch (Exception) { }

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

async function saveInvoice() {
    const apiUrl = 'http://localhost:8090/api/saskaitos';
    const invoiceTypeId = document.getElementById('invoiceType').value;
    const invoiceNumber = document.getElementById('invoiceNumber').value;
    const invoiceDate = document.getElementById('invoiceDate').value;
    const supplierId = document.getElementById('supplier').value;
    const sumBeforeTax = document.getElementById('sumBeforeTax').value;
    const tax = document.getElementById('tax').value;
    const sumAfterTax = document.getElementById('sumAfterTax').value;

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
        console.log(invoice);
        await axios.post(apiUrl, invoice);
        window.location.href = "http://127.0.0.1:5500/views/invoices.html?info=d";
    } catch (error) {
        console.error('Error saving invoice:', error);
    }
}