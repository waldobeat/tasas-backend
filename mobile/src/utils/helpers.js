export const formatNumber = (value) => {
    if (!value) return '0,00';
    let num = value;
    if (typeof value === 'string') {
        num = parseFloat(value.replace(/\./g, '').replace(',', '.'));
    }
    if (isNaN(num)) return '0,00';
    return num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
