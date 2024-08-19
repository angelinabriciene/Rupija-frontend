fetchSuppliers();

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
                <tr>
                    <th scope="row">${index + 1}</th>
                    <td><a href="oneSupplier.html?id=${supplier.id}" data-type="${supplier.id}">${supplier.name}</a></td>
                    <td>${supplier.supplierCode}</td>
                    <td>${supplier.supplierTaxCode}</td>
                    <td>${supplier.adress}</td>
                    <td>${supplier.supplierBankAcc}</td>
                    <td><button id="updateSupplier-${supplier.id}" data-id="${supplier.id}">Redaguoti</button></td>
                    <td><button id="deleteSupplier-${supplier.id}" data-id="${supplier.id}">Ištrinti</button></td>
                </tr>
            `;
                supplierTable.querySelector('tbody').insertAdjacentHTML('beforeend', supplierRow);
            } else {
                console.warn('Invalid supplier object:', supplier);
            }
        });

    } catch (error) {
        console.error('Error fetching suppliers:', error);
    }
}
