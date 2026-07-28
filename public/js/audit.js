async function loadAuditLogs() {

    const response = await fetch('/api/audit');

    const logs = await response.json();

    const tbody = document.getElementById('audit-body');

    tbody.innerHTML = '';

    logs.forEach(log => {

        tbody.innerHTML += `
        <tr>

            <td>${new Date(log.created_at).toLocaleString()}</td>

            <td>${log.username}</td>

            <td>
                <span class="badge bg-primary">
                    ${log.action}
                </span>
            </td>

            <td>${log.table_affected}</td>

            <td>${log.record_id ?? '-'}</td>

            <td>${log.details}</td>

        </tr>
        `;

    });

}

document.getElementById("search").addEventListener("keyup", function () {

    const value = this.value.toLowerCase();

    const rows = document.querySelectorAll("#audit-body tr");

    rows.forEach(row => {

        row.style.display =
            row.innerText.toLowerCase().includes(value)
                ? ""
                : "none";

    });

});

loadAuditLogs();
function exportAuditExcel() {

    window.location.href = "/api/audit/export";

}