
export {};

declare global {
  interface String {
    toBRTDateString(): string;
  }
  interface Date {
    toBRTISOString(): string;
  }
}

String.prototype.toBRTDateString = function() {
  if (!this.includes('T') && !this.includes('-')) return this.toString();
  try {
    const d = new Date(this.toString());
    if (isNaN(d.getTime())) return this.toString().split('T')[0];
    const brt = new Date(d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const pad = (n) => n.toString().padStart(2, '0');
    return `${brt.getFullYear()}-${pad(brt.getMonth() + 1)}-${pad(brt.getDate())}`;
  } catch(e) {
    return this.toString().split('T')[0];
  }
};

Date.prototype.toBRTISOString = function() {
  const brt = new Date(this.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const pad = (n) => n.toString().padStart(2, '0');
  return `${brt.getFullYear()}-${pad(brt.getMonth() + 1)}-${pad(brt.getDate())}T${pad(brt.getHours())}:${pad(brt.getMinutes())}:${pad(brt.getSeconds())}-03:00`;
};
