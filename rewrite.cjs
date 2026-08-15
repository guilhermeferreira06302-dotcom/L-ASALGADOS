const fs = require('fs');

const originalCode = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// We will replace the entire loading and saving mechanism.
// Remove the localStorage and generic app_settings load/save, and replace with direct table fetches.

let newCode = originalCode;

// 1. Replace the loading effect
const loadingEffectRegex = /  \/\/ Load from LocalStorage and Cloud[\s\S]*?window\.removeEventListener\('storage', handleStorageChange\);\n  \}, \[\]\);/m;

const newLoadingEffect = `  // Load from Relational Tables in Cloud
  useEffect(() => {
    const loadData = async () => {
      try {
        setSyncStatus('SYNCING');
        const [
          { data: dbUsers },
          { data: dbCategories },
          { data: dbIngredients },
          { data: dbProducts },
          { data: dbOrders },
          { data: dbTransactions },
          { data: dbMovements },
          { data: dbAudits },
          { data: dbShifts }
        ] = await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('custom_categories').select('*'),
          supabase.from('ingredients').select('*'),
          supabase.from('products').select('*'),
          supabase.from('orders').select('*'),
          supabase.from('transactions').select('*'),
          supabase.from('stock_movements').select('*'),
          supabase.from('inventory_audits').select('*'),
          supabase.from('shifts').select('*')
        ]);

        if (dbUsers) setUsers(dbUsers);
        if (dbCategories) setCustomCategories(dbCategories.map((c: any) => c.name));
        if (dbIngredients) setIngredients(dbIngredients);
        if (dbProducts) setProducts(dbProducts);
        if (dbOrders) setOrders(dbOrders);
        if (dbTransactions) setTransactions(dbTransactions);
        if (dbMovements) setStockMovements(dbMovements);
        if (dbAudits) setAudits(dbAudits);
        if (dbShifts) {
          setShifts(dbShifts.filter((s: any) => s.status === 'CLOSED'));
          const open = dbShifts.find((s: any) => s.status === 'OPEN');
          if (open) setCurrentShift(open);
        }
        
        setSyncStatus('SYNCED');
        setLastSyncTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Failed to load from DB:', err);
        setSyncStatus('ERROR');
      }
    };
    
    loadData();
  }, []);`;

newCode = newCode.replace(loadingEffectRegex, newLoadingEffect);

// 2. Remove the auto-save effect
const saveEffectRegex = /  useEffect\(\(\) => {\n    const stateToSave = \{[\s\S]*?}, \[users, ingredients, products, orders, transactions, audits, stockMovements, customCategories, currentShift, shifts\]\);/m;
newCode = newCode.replace(saveEffectRegex, '');

// 3. Inject supabase calls into mutation functions
// To do this reliably with regex, we can create a wrapper function for mutations.
// But it's easier to just inject the supabase calls directly before setState.

const injections = [
  { match: /setUsers\(\(prev\) => prev\.map\(\(u\) => \(u\.id === user\.id \? user : u\)\)\);/, insert: `supabase.from('users').update(user).eq('id', user.id).then();\n    ` },
  { match: /setUsers\(\(prev\) => \[\.\.\.prev, newUser\]\);/, insert: `supabase.from('users').insert(newUser).then();\n    ` },
  { match: /setUsers\(\(prev\) => prev\.filter\(\(u\) => u\.id !== id\)\);/, insert: `supabase.from('users').delete().eq('id', id).then();\n    ` },
  
  { match: /setProducts\(\(prev\) => \[\.\.\.prev, newProduct\]\);/, insert: `supabase.from('products').insert(newProduct).then();\n    ` },
  { match: /setProducts\(\(prev\) => prev\.map\(\(p\) => \(p\.id === product\.id \? product : p\)\)\);/, insert: `supabase.from('products').update(product).eq('id', product.id).then();\n    ` },
  { match: /setProducts\(\(prev\) => prev\.filter\(\(p\) => p\.id !== id\)\);/, insert: `supabase.from('products').delete().eq('id', id).then();\n    ` },

  { match: /setIngredients\(\(prev\) => \[\.\.\.prev, newIng\]\);/, insert: `supabase.from('ingredients').insert(newIng).then();\n    ` },
  { match: /setIngredients\(\(prev\) => prev\.map\(\(i\) => \(i\.id === ing\.id \? ing : i\)\)\);/, insert: `supabase.from('ingredients').update(ing).eq('id', ing.id).then();\n    ` },

  { match: /setStockMovements\(\(prev\) => \[movement, \.\.\.prev\]\);/, insert: `supabase.from('stock_movements').insert(movement).then();\n        ` },
  
  { match: /setAudits\(\(prev\) => \[auditRecord, \.\.\.prev\]\);/, insert: `supabase.from('inventory_audits').insert(auditRecord).then();\n    ` },
  
  { match: /setOrders\(\(prev\) => \[newOrder, \.\.\.prev\]\);/, insert: `supabase.from('orders').insert(newOrder).then();\n    ` },
  { match: /setOrders\(\(prev\) => prev\.map\(\(o\) => \(o\.id === orderId \? \{ \.\.\.o, status: newStatus \} : o\)\)\);/, insert: `supabase.from('orders').update({ status: newStatus }).eq('id', orderId).then();\n    ` },

  { match: /setTransactions\(\(prev\) => \[newTx, \.\.\.prev\]\);/, insert: `supabase.from('transactions').insert(newTx).then();\n    ` },

  { match: /setCustomCategories\(\(prev\) => \{\n      if \(prev\.includes\(clean\)\) return prev;\n      return \[\.\.\.prev, clean\];\n    \}\);/, insert: `supabase.from('custom_categories').insert({ name: clean }).then();\n    ` },
  { match: /setCustomCategories\(\(prev\) => prev\.filter\(\(c\) => c !== name\)\);/, insert: `supabase.from('custom_categories').delete().eq('name', name).then();\n    ` },

  { match: /setCurrentShift\(newShift\);/, insert: `supabase.from('shifts').insert(newShift).then();\n    ` },
  { match: /setShifts\(\(prev\) => \[closedShift, \.\.\.prev\]\);/, insert: `supabase.from('shifts').update(closedShift).eq('id', currentShift.id).then();\n    ` },
  { match: /setCurrentShift\(null\);/, insert: `if (shiftId) supabase.from('shifts').delete().eq('id', shiftId).then(); else if (currentShift) supabase.from('shifts').delete().eq('id', currentShift.id).then();\n      ` },
  { match: /setShifts\(\(prev\) => prev\.filter\(\(s\) => s\.id !== shiftId\)\);/, insert: `if (shiftId) supabase.from('shifts').delete().eq('id', shiftId).then();\n      ` }
];

injections.forEach(({ match, insert }) => {
  newCode = newCode.replace(match, insert + '$&');
});

// For updateCustomCategory, it's a bit more complex because it updates name
newCode = newCode.replace(/setCustomCategories\(\(prev\) => prev\.map\(\(c\) => c === oldName \? cleanNew : c\)\);/, 
  `supabase.from('custom_categories').update({ name: cleanNew }).eq('name', oldName).then();\n    $&`);

// For adjustStock, we need to update the specific ingredient
newCode = newCode.replace(/setIngredients\(\(prev\) => prev\.map\(\(ing\) => \{\n      if \(ing\.id === ingredientId\) \{\n        return \{ \.\.\.ing, currentStock: Math\.max\(0, ing\.currentStock \+ quantityChange\), lastUpdated: new Date\(\)\.toISOString\(\) \};\n      \}\n      return ing;\n    \}\)\);/, 
  `const ingToUpdate = ingredients.find(i => i.id === ingredientId);
    if (ingToUpdate) {
      supabase.from('ingredients').update({ currentStock: Math.max(0, ingToUpdate.currentStock + quantityChange), lastUpdated: new Date().toISOString() }).eq('id', ingredientId).then();
    }
    $&`);

// Same for performInventoryAudit ingredients update
newCode = newCode.replace(/setIngredients\(\(prev\) => prev\.map\(\(ing\) => \{\n      const adj = adjustments\.find\(\(a\) => a\.ingredientId === ing\.id\);\n      if \(adj\) \{\n        return \{ \.\.\.ing, currentStock: adj\.actualStock, lastUpdated: new Date\(\)\.toISOString\(\) \};\n      \}\n      return ing;\n    \}\)\);/,
  `adjustments.forEach(adj => {
      supabase.from('ingredients').update({ currentStock: adj.actualStock, lastUpdated: new Date().toISOString() }).eq('id', adj.ingredientId).then();
    });
    $&`);

fs.writeFileSync('src/context/AppContext.tsx', newCode);
console.log('App context overwritten successfully');
