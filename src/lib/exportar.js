/* Exportar gastos a CSV (abre en Excel). En la app nativa usa compartir;
   en el navegador descarga el archivo. */
const IS_NATIVE = typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.();

export async function exportGastosCSV(gastos, sobres) {
  const sobreMap = {};
  sobres.forEach((s) => { sobreMap[s.id] = s.nombre; });
  const header = "Fecha,Monto,Sobre,Categoria,Medio de pago,Nota";
  const rows = gastos.map((g) => {
    const sobre = g.sobre_id ? (sobreMap[g.sobre_id] || "") : "Fuera de sobres";
    const nota = (g.nota || "").replace(/"/g, '""');
    return `${g.fecha},${g.monto},"${sobre}","${g.categoria || ""}","${g.medio_pago || ""}","${nota}"`;
  });
  const csv = [header, ...rows].join("\n");
  const filename = `sobres-semanales-gastos-${new Date().toISOString().slice(0, 10)}.csv`;

  if (IS_NATIVE) {
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");
      const result = await Filesystem.writeFile({ path: filename, data: btoa("﻿" + csv), directory: Directory.Cache });
      await Share.share({ title: filename, url: result.uri });
    } catch {
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  } else {
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
