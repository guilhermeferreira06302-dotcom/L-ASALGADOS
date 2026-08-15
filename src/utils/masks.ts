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
  
  if (typeof value === 'number') {
    let strVal = value.toString();
    const parts = strVal.split('.');
    let intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    if (parts.length > 1) {
      return intPart + ',' + parts[1];
    }
    return intPart;
  }

  let strVal = String(value);
  const isNegative = strVal.startsWith('-');
  
  // Se usuário digitou ponto mas não tem vírgula, assume que queria digitar decimal (ex: numpad)
  if (strVal.includes('.') && !strVal.includes(',')) {
     if ((strVal.match(/\./g) || []).length === 1) {
        strVal = strVal.replace('.', ',');
     }
  }

  // Remove tudo que não for dígito ou vírgula
  let v = strVal.replace(/[^\d,]/g, '');
  
  if (v === '') return '';

  // Garantir apenas uma vírgula
  const commaCount = (v.match(/,/g) || []).length;
  if (commaCount > 1) {
    const parts = v.split(',');
    v = parts[0] + ',' + parts.slice(1).join('');
  }
  
  // Separar parte inteira e decimal
  const parts = v.split(',');
  
  // Formatar parte inteira com pontos (separador de milhar)
  let intPart = parts[0].replace(/^0+(?=\d)/, '');
  if (intPart === '') intPart = '0';
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Juntar tudo
  let result = parts.length > 1 ? `${intPart},${parts[1]}` : intPart;
  
  if (v === ',') result = '0,';
  
  return isNegative ? '-' + result : result;
};

export const parseQuantity = (value: string | number): number => {
  if (typeof value === 'number') return value;
  
  let strVal = String(value);
  
  // Tratar ponto como vírgula se não houver vírgula
  if (strVal.includes('.') && !strVal.includes(',')) {
    if ((strVal.match(/\./g) || []).length === 1) {
       strVal = strVal.replace('.', ',');
    }
  }

  // Remove pontos (separadores de milhar) e troca vírgula por ponto
  let v = strVal.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  
  const isNegative = v.startsWith('-');
  v = v.replace(/-/g, '');
  if (!v) return 0;
  
  const num = parseFloat(v);
  if (isNaN(num)) return 0;
  
  return isNegative ? -num : num;
};
