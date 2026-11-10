import VendedorSidebar from '../components/organisms/VendedorSidebar'

// Las órdenes (boletas) vendrán de ordenes-service. Esta pantalla queda lista y restringida al rol vendedor.
const VendedorOrdenes = () => {
    return (
        <div className="container-fluid">
            <div className="row min-vh-100">
                <VendedorSidebar />

                <main className="col-md-9 col-lg-10 p-4">
                    <h1>Órdenes</h1>
                    <p className="text-muted">Lista de órdenes y su detalle (solo lectura).</p>

                    <div className="alert alert-info">
                        Pendiente: aquí se mostrará la lista de órdenes cuando se conecte el microservicio de órdenes.
                    </div>
                </main>
            </div>
        </div>
    )
}

export default VendedorOrdenes
