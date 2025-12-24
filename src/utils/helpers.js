export const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export const calculateSharePrice = (totalPrice, totalShares) => {
    if (!totalShares || totalShares === 0) return 0;
    return Math.ceil(totalPrice / totalShares);
};
