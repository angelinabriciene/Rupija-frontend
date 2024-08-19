fetchSupplier();

async function fetchSupplier() {
    const supplierId = new URLSearchParams(window.location.search).get('id');
    try {
      const response = await axios.get(`http://localhost:8090/api/tiekejai/${supplierId}`);
      const supplier = response.data;
    //   const flowers = type.flowers || [];
  
    //   const validFlowers = flowers.filter(flower => flower && typeof flower === 'object' && flower.id);
      
    //   const totalItemCount = validFlowers.length;
      const supplierHeader = document.getElementById('supplierHeader');
      supplierHeader.innerHTML = `<h2>${supplier.name}</h2>`; //${supplier.name} (${totalItemCount})
  
    //   allFlowers = validFlowers;
  
    //   applyFilters();
    } catch (error) {
      console.error('Error fetching supplier:', error);
    }
  }