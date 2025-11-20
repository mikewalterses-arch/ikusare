export default function AdminHome() {
    return (
      <div className="text-white px-6 py-10">
        <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>
  
        <div className="grid gap-4">
          <a
            href="/admin/movies"
            className="p-5 bg-[#1D3557] rounded-xl hover:bg-[#E63946]/20 transition"
          >
            <h2 className="text-xl font-semibold">Editar Películas / Series</h2>
            <p className="text-gray-300">Editar títulos, idiomas, plataformas…</p>
          </a>
        </div>
      </div>
    );
  }
  