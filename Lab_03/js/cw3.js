document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const tbody = document.getElementById('products-body');

    let originalProducts = []; //miejsce na orginalne dane

    //Funkcja rysująca wiersze tabeli na podstawie przekazanej tablicy
    const renderTable = (products) => {
        tbody.innerHTML = '';

        products.forEach((product) => {
            const tr = document.createElement('tr');

            // Kolumna 1: Zdjęci
            const imgTd = document.createElement('td');
            const img = document.createElement('img');
            img.src = product.thumbnail;
            img.alt = product.title;
            imgTd.appendChild(img);

            // Kolumna 2: Tytuł
            const titleTd = document.createElement('td');
            titleTd.textContent = product.title;

            // Kolumna 3: Opis
            const descTd = document.createElement('td');
            descTd.textContent = product.description;

            tr.appendChild(imgTd);
            tr.appendChild(titleTd);
            tr.appendChild(descTd);
            tbody.appendChild(tr);
        });
    };

    const updateView = () => {
        const query = searchInput.value.toLowerCase().trim();
        const sortMode = sortSelect.value;

        //Filtrowanie
        let result = originalProducts.filter((product) => {
            const titleMatch = product.title.toLowerCase().includes(query);
            const descMatch = product.description.toLowerCase().includes(query);
            return titleMatch || descMatch;
        });

        //Sortowanie
        if (sortMode === 'asc') {
            result.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortMode === 'desc') {
            result.sort((a, b) => b.title.localeCompare(a.title));
        }

        renderTable(result);
    };

    const fetchProducts = async () => {
        const response = await fetch('https://dummyjson.com/products');
        const data = await response.json();

        originalProducts = data.products.slice(0, 30);
        renderTable(originalProducts);
    };

    searchInput.addEventListener('input', updateView);
    sortSelect.addEventListener('change', updateView);

    fetchProducts();
});