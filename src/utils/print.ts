import { Order } from '../types';

export const printOrderTicket = (order: Order) => {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    alert('Please allow pop-ups to print tickets');
    return;
  }

  const itemsHtml = order.items.map(item => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 16px;">
      <span style="font-weight: bold;">${item.quantity}x ${item.name.toUpperCase()}</span>
    </div>
  `).join('');

  const orderTime = new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const orderDate = new Date(order.timestamp).toLocaleDateString();

  printWindow.document.write(`
    <html>
      <head>
        <title>Order ${order.id}</title>
        <style>
          @page { size: 80mm 200mm; margin: 0; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            width: 72mm; 
            margin: 0;
            padding: 5mm; 
            box-sizing: border-box;
            background: #fff;
            color: #000;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 10px; 
            margin-bottom: 15px; 
          }
          .order-id {
            font-size: 32px;
            font-weight: 900;
            margin: 10px 0;
          }
          .items { 
            min-height: 100px;
          }
          .footer { 
            border-top: 1px dashed #000; 
            padding-top: 15px; 
            margin-top: 20px; 
            text-align: center; 
            font-size: 12px;
            font-weight: bold;
          }
          .meta {
            font-size: 12px;
            margin-bottom: 5px;
          }
          @media print {
            body { padding: 0; margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="font-size: 14px; font-weight: bold;">WITBANK EXPRESS GRILL</div>
          <div style="font-size: 10px; margin-top: 2px;">KITCHEN TICKET</div>
          <div class="order-id">${order.id.includes('-') ? order.id.split('-')[1] : order.id}</div>
          <div class="meta">${orderDate} | ${orderTime}</div>
        </div>
        <div class="items">
          ${itemsHtml}
        </div>
        <div class="footer">
          <p>PLEASE PREPARE ASAP</p>
          <p style="font-size: 8px; margin-top: 10px;">ID: ${order.id}</p>
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
