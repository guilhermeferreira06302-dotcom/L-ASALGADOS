export const currencyMask = (value: string | number): string => {
  if (value === undefined || value === null) return '';
  const strVal = String(value);
  const isNegative = strVal.startsWith('-');
  
  let v = typeof value === 'number' ? Math.round(Math.abs(value) * 100).toString() : strVal.replace(/\D/g, '');
  
  if (v === '' || v === '0') return ''; 
  
  const num = (parseInt(v, 10) / 100).toFixed(2);
  const masked = num.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  return (isNegative ? '-R$ ' : 'R$ ') + masked;
};

export const parseCurrency = (value: string | number): number => {
  if (typeof value === 'number') return value;
  const isNegative = value.startsWith('-');
  const v = value.replace(/\D/g, '');
  if (!v) return 0;
  const num = parseInt(v, 10) / 100;
  return isNegative ? -num : num;
};

export const quantityMask = (value: string | number): string => {
  if (value === undefined || value === null) return '';
  const strVal = String(value);
  const isNegative = strVal.startsWith('-');
  
  let v = typeof value === 'number' ? Math.round(Math.abs(value) * 1000).toString() : strVal.replace(/\D/g, '');
  
  if (v === '') v = '0';
  
  const num = (parseInt(v, 10) / 1000).toFixed(3);
  const masked = num.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  return isNegative ? '-' + masked : masked;
};

export const parseQuantity = (value: string | number): number => {
  if (typeof value === 'number') return value;
  const isNegative = value.startsWith('-');
  const v = value.replace(/\D/g, '');
  if (!v) return 0;
  const num = parseInt(v, 10) / 1000;
  return isNegative ? -num : num;
};
