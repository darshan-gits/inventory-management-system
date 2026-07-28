async function loadHistory() {

    const response = await fetch('/api/history');

    const history = await response.json();

    const tbody = document.getElementById('history-body');

    tbody.innerHTML = '';

    history.forEach(item => {

        tbody.innerHTML += `
        <tr>

        <td>
        ${new Date(item.created_at).toLocaleString()}
        </td>

        <td>
        ${item.product_name}
        </td>

        <td>

        ${
            item.type === 'IN'
            ?
            '<span class="badge bg-success">IN</span>'
            :
            '<span class="badge bg-danger">OUT</span>'
        }

        </td>

        <td>

        ${item.quantity}

        </td>

        <td>

        ${item.remarks}

        </td>

        </tr>
        `;

    });

}

loadHistory();