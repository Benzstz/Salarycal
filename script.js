let myChart = null;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('salaryForm');

    // Auto-calculate on load
    calculateAndRender();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        calculateAndRender();
    });

    // Optional: Add simple validation to age input to not exceed 55
    const ageInput = document.getElementById('currentAge');
    if (ageInput) {
        ageInput.addEventListener('input', (e) => {
            if (e.target.value >= 55) {
                alert('โปรแกรมคำนวณถึงอายุเกษียณ 55 ปีเท่านั้น (Calculations stop at age 55)');
                e.target.value = 54;
            }
        });
    }
});

function calculateAndRender() {
    // 1. Get Values
    const currentSalary = parseFloat(document.getElementById('currentSalary').value) || 0;
    const currentAge = parseInt(document.getElementById('currentAge').value) || 30;
    const bonusMonths = parseFloat(document.getElementById('bonusMonths').value) || 0;
    const salaryHike = parseFloat(document.getElementById('salaryHike').value) || 0;
    const otHours = parseFloat(document.getElementById('otHours').value) || 0;

    const retirementAge = 55;

    if (currentAge >= retirementAge) {
        alert('อายุต้องน้อยกว่า 55 ปี เพื่อเริ่มการคำนวณ (Age must be < 55)');
        return;
    }

    // 2. Prepare Calculation Loop
    let yearData = [];
    let runningSalary = currentSalary;
    let accumulatedIncome = 0;
    let totalBonusAcc = 0;

    // Loop from current age up to 54 (last working year before 55)
    for (let age = currentAge; age < retirementAge; age++) {
        // Calculate hourly rate (Salary / 30 / 8)
        const hourlyRate = runningSalary / 30 / 8;
        // OT Income (1.5x) per month * 12 months
        // Logic: OT rate is 1.5 * hourly rate.
        const monthlyOT = hourlyRate * 1.5 * otHours;
        const annualOT = monthlyOT * 12;

        const annualBaseSalary = runningSalary * 12;
        const annualBonus = runningSalary * bonusMonths;
        const totalAnnual = annualBaseSalary + annualBonus + annualOT;

        accumulatedIncome += totalAnnual;
        totalBonusAcc += annualBonus;

        yearData.push({
            age: age,
            monthlySalary: runningSalary,
            annualOT: annualOT,
            annualBonus: annualBonus,
            totalAnnual: totalAnnual,
            accumulated: accumulatedIncome
        });

        // Increase salary for next year
        runningSalary = runningSalary * (1 + (salaryHike / 100));
    }

    // 3. Render Results
    renderSummary(yearData, accumulatedIncome, totalBonusAcc);
    renderTable(yearData);
    renderChart(yearData);
}

function renderSummary(data, totalInc, totalBonus) {
    if (data.length === 0) return;

    const lastYear = data[data.length - 1];

    // Format helper
    const fmt = (n) => n.toLocaleString('th-TH', { maximumFractionDigits: 0 });

    document.getElementById('totalEarnings').textContent = fmt(totalInc) + " ฿";
    document.getElementById('lastSalary').textContent = fmt(lastYear.monthlySalary) + " ฿";
    document.getElementById('totalBonus').textContent = fmt(totalBonus) + " ฿";
}

function renderTable(data) {
    const tbody = document.getElementById('resultBody');
    tbody.innerHTML = '';

    const fmt = (n) => n.toLocaleString('th-TH', { maximumFractionDigits: 0 });

    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.age}</td>
            <td>${fmt(row.monthlySalary)}</td>
            <td class="text-orange">${fmt(row.annualOT)}</td>
            <td class="text-green">${fmt(row.annualBonus)}</td>
            <td><strong>${fmt(row.totalAnnual)}</strong></td>
            <td class="text-muted">${fmt(row.accumulated)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderChart(data) {
    const ctx = document.getElementById('incomeChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (myChart) {
        myChart.destroy();
    }

    const labels = data.map(d => `Age ${d.age}`);
    const salaryData = data.map(d => d.monthlySalary * 12);
    const otData = data.map(d => d.annualOT);
    const bonusData = data.map(d => d.annualBonus);

    // Create gradient
    const gradientFill = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradientFill.addColorStop(0, 'rgba(99, 102, 241, 0.5)');
    gradientFill.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'เงินเดือน (Annual Salary)',
                    data: salaryData,
                    backgroundColor: '#6366f1',
                    stack: 'Stack 0',
                },
                {
                    label: 'โอที (Annual OT)',
                    data: otData,
                    backgroundColor: '#f59e0b', // Amber/Orange
                    stack: 'Stack 0',
                },
                {
                    label: 'โบนัส (Annual Bonus)',
                    data: bonusData,
                    backgroundColor: '#10b981', // Emerald/Green
                    borderRadius: 4,
                    stack: 'Stack 0',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    displayColors: true,
                },
                legend: {
                    labels: {
                        color: '#cbd5e1'
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: { color: '#94a3b8' },
                    grid: { display: false }
                },
                y: {
                    stacked: true,
                    ticks: {
                        color: '#94a3b8',
                        callback: function (value) {
                            return value / 1000 + 'k';
                        }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}
