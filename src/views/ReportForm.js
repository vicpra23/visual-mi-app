function renderReport(container, editData = null) {
    const session = getSessionData();
    const currentUser = session ? session.user : '';
    const role = session ? session.role : '';
    let isLoadingEdit = !!editData;

    const distribuidores = {
        "MediaMarkt": [
            "Central", "MediaMarkt Barcelona - Francesc Macià", "MediaMarkt Cornellà-El Prat", "MediaMarkt Diagonal Mar", "MediaMarkt Esplugues", 
            "MediaMarkt Gavà", "MediaMarkt La Maquinista", "MediaMarkt Mataró", "MediaMarkt Badalona", "MediaMarkt Parets del Vallès", 
            "MediaMarkt Plaza Cataluña", "MediaMarkt Ronda Sant Antoni", "MediaMarkt Sabadell", "MediaMarkt Sant Cugat", 
            "MediaMarkt Terrassa", "MediaMarkt Vilanova i la Geltrú", "MediaMarkt Girona", "MediaMarkt Parc d'Aro", 
            "MediaMarkt Porta Lloret", "MediaMarkt Lleida", "MediaMarkt Tarragona", "MediaMarkt Almería", "MediaMarkt Gran Plaza", 
            "MediaMarkt Bahía de Cádiz", "MediaMarkt Jerez de la Frontera", "MediaMarkt Los Barrios", "MediaMarkt Córdoba", 
            "MediaMarkt Nevada", "MediaMarkt Granda - Pulianas", "MediaMarkt Huelva", "MediaMarkt Jaén", "MediaMarkt Málaga - La Cañada", 
            "MediaMarkt Mijas", "MediaMarkt Málaga", "MediaMarkt Plaza Mayor", "MediaMarkt Vélez", "MediaMarkt Alcalá de Guadaíra", 
            "MediaMarkt Lagoh", "MediaMarkt Los Arcos", "MediaMarkt San Juan de Aznalfarache", "MediaMarkt Badajoz", 
            "MediaMarkt Albacete", "MediaMarkt Alicante", "MediaMarkt Elche", "MediaMarkt Finestrat", "MediaMarkt La Zenia", 
            "MediaMarkt Castellón", "MediaMarkt Vinaròs", "MediaMarkt Cartagena", "MediaMarkt Lorca", "MediaMarkt Nueva Condomina", 
            "MediaMarkt Ronda Sur", "MediaMarkt Alfafar", "MediaMarkt Valencia - Aqua", "MediaMarkt Valencia - Colón", 
            "MediaMarkt Gandía", "MediaMarkt Massalfassar", "MediaMarkt Valencia - Palacio de Congresos", "MediaMarkt Quart de Poblet", 
            "MediaMarkt - Toledo", "MediaMarkt Ciudad Real", "MediaMarkt Alcalá de Henares", "MediaMarkt Alcorcón", 
            "MediaMarkt Benlliure - Goya", "MediaMarkt Castellana", "MediaMarkt Collado Villalba", "MediaMarkt Fuenlabrada", 
            "MediaMarkt Getafe", "MediaMarkt Isazul", "MediaMarkt Leganés", "MediaMarkt Majadahonda", "MediaMarkt Plaza del Carmen", 
            "MediaMarkt Plenilunio", "MediaMarkt Rivas Vaciamadrid", "MediaMarkt Torrejón", "MediaMarkt Vaguada", "MediaMarkt Vallecas", 
            "MediaMarkt Villaverde", "MediaMarkt Talavera", "MediaMarkt Santander", "MediaMarkt Vigo", "MediaMarkt A Coruña", 
            "MediaMarkt Ferrol", "MediaMarkt Santiago de Compostela", "MediaMarkt Vitoria", "MediaMarkt Siero", "MediaMarkt Bilbondo", 
            "MediaMarkt Zubiarte", "MediaMarkt Barakaldo", "MediaMarkt Donosti", "MediaMarkt Logroño", "MediaMarkt León", 
            "MediaMarkt Lugo", "MediaMarkt Pamplona - Cordovilla", "MediaMarkt Vigo 2", "MediaMarkt Salamanca", "MediaMarkt Valladolid", 
            "MediaMarkt Vistalegre", "MediaMarkt CC Gran Casa", "MediaMarkt Puerto Venecia", "MediaMarkt Burgos", 
            "MediaMarkt Palma de Mallorca", "MediaMarkt Palma Fan", "MediaMarkt Lanzarote", "MediaMarkt Las Arenas", 
            "MediaMarkt Alisios", "MediaMarkt Telde", "MediaMarkt Tenerife", "MediaMarkt Tres de Mayo", "MediaMarkt Adeje", "MediaMarkt Melilla"
        ],
        "ECI": [
            "Central", "El Corte Inglés A Coruña", "El Corte Inglés Ademuz", "El Corte Inglés Alcalá de Henares", "El Corte Inglés Alexandre Rosselló", 
            "El Corte Inglés Alicante", "El Corte Inglés Arabial", "El Corte Inglés Albacete", "El Corte Inglés Avenida de Francia", 
            "El Corte Inglés Badajoz", "El Corte Inglés Avilés", "El Corte Inglés Bahía Málaga", "El Corte Inglés Bahía de Algeciras", 
            "El Corte Inglés Bahía de Cádiz", "El Corte Inglés Campo de Las Naciones", "El Corte Inglés Can Dragó", "El Corte Inglés Cartagena", 
            "El Corte Inglés Castellana", "El Corte Inglés Ciudad de Elche", "El Corte Inglés Conquistadores - Badajoz", "El Corte Inglés Cornellà", 
            "El Corte Inglés Costa Mijas", "El Corte Inglés Diagonal", "El Corte Inglés El Bercial", "El Corte Inglés Marbella", 
            "El Corte Inglés El Ejido", "El Corte Inglés Guadalajara", "El Corte Inglés León", "El Corte Inglés Gaia Porto", 
            "El Corte Inglés Genil", "El Corte Inglés Gijón", "El Corte Inglés Girona", "El Corte Inglés Goya", "El Corte Inglés Gran Vía - Bilbao", 
            "El Corte Inglés Huelva", "El Corte Inglés Independencia", "El Corte Inglés Jaume III", "El Corte Inglés Jaén", "El Corte Inglés Jerez", 
            "El Corte Inglés José Mesa y López", "El Corte Inglés Lisboa", "El Corte Inglés Madrid Xanadú", "El Corte Inglés Salamanca", 
            "El Corte Inglés Murcia", "El Corte Inglés Málaga", "El Corte Inglés Nervión", "El Corte Inglés Nuevo Centro", 
            "El Corte Inglés Oviedo Salesas", "El Corte Inglés Oviedo Uría", "El Corte Inglés Pamplona", "El Corte Inglés Parque Burgos", 
            "El Corte Inglés Castellón", "El Corte Inglés Pintor Sorolla-Colón", "El Corte Inglés Plaza del Duque", "El Corte Inglés Plaça de Catalunya", 
            "El Corte Inglés Pozuelo", "El Corte Inglés Preciados-Callao", "El Corte Inglés Princesa", "El Corte Inglés Puerto Venecia", 
            "El Corte Inglés Ronda de Córdoba", "El Corte Inglés Ronda de los Tejares - Cordoba", "El Corte Inglés Sabadell", "El Corte Inglés Sagasta", 
            "El Corte Inglés San José de Valderas", "El Corte Inglés San Juan De Aznalfarache", "El Corte Inglés Sanchinarro", 
            "El Corte Inglés Santander", "El Corte Inglés Santiago de Compostela", "El Corte Inglés Serrano", "El Corte Inglés Sevilla Este", 
            "El Corte Inglés Siete Palmas", "El Corte Inglés Talavera de la Reina", "El Corte Inglés Tarragona", "El Corte Inglés Tres de Mayo", 
            "El Corte Inglés Vigo", "El Corte Inglés Vista Alegre", "El Corte Inglés Vitoria", "El Corte Inglés Zorrilla - Valladolid", 
            "Supermercado El Corte Inglés A Coruña", "Supermercado El Corte Inglés Boadilla", "Supermercado El Corte Inglés Burgos", 
            "Supermercado El Corte Inglés El Escorial", "Supermercado El Corte Inglés Reyes Magos", "Supermercado El Corte Inglés Somosaguas", 
            "Supermercado El Corte Inglés de López Ibor", "Supermercado de El Corte Inglés Francesc Macià", "Supermercado de El Corte Inglés Sotogrande"
        ],
        "Carrefour": [
            "Central", "Aluche", "Hortaleza", "Las Rosas", "Los Ángeles", "Madrid Sur", "La Gavia", "Pinar de Chamartín", 
            "Conde de Peñalver", "Alcalá de Henares", "Alcobendas", "Alcorcón", "Getafe", "Leganés", "Majadahonda", 
            "Móstoles", "Pinar de las Rozas", "Rivas-Vaciamadrid", "San Fernando de Henares", "Torrejón de Ardoz", 
            "Villalba", "Toledo", "Talavera de la Reina", "Ciudad Real", "Puertollano", "Alcázar de San Juan", 
            "Albacete", "Guadalajara", "Cuenca", "Badajoz (Valdepasillas)", "Badajoz (La Granadilla)", "Mérida", 
            "Don Benito - Villanueva", "Zafra", "Cáceres", "Plasencia", "San Pablo", "Macarena", "Montequinto", 
            "Camas", "San Juan de Aznalfarache", "Dos Hermanas", "Écija", "Alameda", "Los Patios", "La Rosaleda", 
            "Rincón de la Victoria", "Mijas", "Estepona", "Vélez-Málaga", "Torremolinos", "Antequera", "Coín", 
            "Bahía (San Fernando)", "Jerez Norte", "Jerez Sur", "El Paseo (El Puerto)", "Algeciras", "La Línea", 
            "Los Barrios", "Sanlúcar", "Granada (Armilla)", "Pulianas", "Motril", "Granada (Nevada)", "La Sierra", 
            "Zahira", "Lucena", "Baena", "Almería", "Roquetas de Mar", "El Ejido", "Vícar", "Huércal-Overa", "Huelva", 
            "Cartaya", "La Palma del Condado", "Jaén", "Úbeda", "Andújar", "Atalayas", "Zaraiche", "El Tiro", 
            "Cartagena", "Paseo Alfonso XIII", "Lorca", "Águilas", "San Javier", "Yecla", "El Saler", "Campanar", 
            "Arena", "Alfafar", "Paterna (Heron City)", "Paterna (Pista de Ademuz)", "Massalfassar", "Sagunto", 
            "Alzira", "Gandía", "La Eliana", "Cullera", "Ontinyent", "Xàtiva", "Puerta de Alicante", "Gran Vía", 
            "San Juan", "Elche", "Torrevieja", "Benidorm (Finestrat)", "Dénia", "Orihuela", "Petrer", 
            "Valladolid (Parquesol)", "Valladolid (Delicias)", "Laguna de Duero", "León", "Ponferrada", 
            "Burgos (El Mirador)", "Burgos (Carretera de Logroño)", "Miranda de Ebro", "Salamanca", 
            "Salamanca (Avenida de los Agustinos)", "Palencia", "Segovia", "Zamora", "Ávila", "Soria", "Santa Pola", 
            "Alcoy", "Torrevieja (Centro)", "Castellón", "Vila-real", "Vinaròs", "A Coruña (Alfonso Molina)", 
            "A Coruña (Los Rosales)", "Santiago de Compostela", "Ferrol", "Oleiros", "Coristanco", "Vigo (Travesía)", 
            "Vigo (Gran Vía)", "Pontevedra", "Lalín", "Lugo", "Ribadeo", "Ourense", "Oviedo (Los Prados)", 
            "Lugones (Azabache)", "Gijón (La Calzada)", "Gijón (Los Fresnos)", "Avilés (Parque Astur)", "Pola de Siero", 
            "Santander (Peñacastillo)", "Santander (El Alisal)", "Torrelavega", "Erandio", "Sestao", "Abadiño", 
            "Oiartzun", "Eibar", "Vitoria (Gorbeia)", "Logroño", "Pamplona", "Tudela", "Augusta", "Actur", 
            "Puerto Venecia", "Utebo", "Huesca", "Teruel", "Barcelona - Glòries", "L'Hospitalet", "Badalona", 
            "Santa Coloma", "Barberà del Vallès", "Sant Cugat", "Terrassa", "Sabadell", "Cornellà", "El Prat", 
            "Gavà", "Cabrera de Mar", "Granollers", "Vic", "Manresa", "Igualada", "Martorell", "Parets del Vallès", 
            "Sant Fruitós de Bages", "Tarragona", "Reus", "Torredembarra", "Amposta", "Girona", "Figueres", "Olot", 
            "Lleida", "Añaza (Santa Cruz)", "Meridiano (Santa Cruz)", "Santa María del Mar", "Las Arenas (Las Palmas)", 
            "La Ballena (Las Palmas)", "Vecindario (Santa Lucía de Tirajana)"
        ],
        "Alcampo": [
            "Central", "Alcobendas", "Alcalá de Henares (La Dehesa)", "Alcorcón", "Colmenar Viejo", "Fuenlabrada (Lorea)", 
            "Getafe", "Leganés", "Majadahonda", "Torrejón de Ardoz", "Madrid - Vaguada", "Madrid - Vallecas", 
            "Madrid - Moratalaz", "Madrid - Pío XII", "Madrid - Estrellas", "Madrid - Vista Alegre", 
            "Zaragoza - Los Enlaces", "Zaragoza - Utebo", "Zaragoza - Picarral", "Zaragoza - Puerto Venecia", 
            "Huesca", "Teruel", "Sevilla", "Granada", "Motril", "Almería", "Jerez de la Frontera", "Sanlúcar de Barrameda", 
            "Algeciras", "Linares", "Marbella", "Barcelona - Diagonal Mar", "Sant Adrià de Besòs", "Sant Boi de Llobregat", 
            "Mataró", "Reus", "Alboraia", "Aldaia", "Castellón", "Alicante", "Orihuela Costa", "Vigo - Coia", 
            "Vigo - Avenida de Madrid", "A Coruña - Palavea", "Santiago de Compostela", "Ferrol", "Vilagarcía de Arousa", 
            "Lugo", "Valladolid", "Burgos", "Salamanca", "Zamora", "Gijón", "Santander", "Oiartzun", "Murcia", "Logroño", 
            "Toledo", "Cuenca", "Valdepeñas", "La Laguna", "Telde", "Marratxí"
        ],
        "MISTORES": [
            "MI ALMERIA", "MI CEUTA", "MI VIGO", "MI STORE C.C. LA GAVIA", "MI PUERTO VENECIA", "MI VALLADOLID", 
            "MI STORE CC GRAN VÍA ALICANTE", "MI STORE CC ISLAZUL", "MI STORE GRAN VÍA 2", "MI STORE MAQUINISTA", 
            "MI STORE XANADU", "MI STORE CASTELLÓN"
        ],
        "Orange": [
            "Central", "ONDALIBRE", "KIWITEL", "ISP", "ONE STORE", "ECOPLANA", "IS CELL", "TIENDAS DE LEVANTE", 
            "FREE TELECOM", "FREE TELECOM (Comerciales)", "OK CLUB", "MUNDOCOM", "MUNDOCOM (COMERCIALES)", 
            "ANEVINIP", "TELMASUR", "PROMOVIL", "CLM", "OSHOP", "Tiendas Propias", "DESPLIEGUE OT NORTE", 
            "DESPLIEGUE OT SUR", "DESPLIEGUE OT CENTRO", "DESPLIEGUE OT CATALUÑA", "DESPLIEGUE OT LEVANTE", 
            "ISGF Murcia", "FOUNDEVER Sevilla", "KONECTA Sevilla", "OEST Oviedo", "MARKTEL Valencia", 
            "Jazzplat Guadalajara", "ISGF Alicante", "TLP Salamanca", "TRANSCOM León", "MAJOREL Salamanca", 
            "TELEPERFORMANCE MEDELLÍN", "JAZZPLAT BOGOTÁ", "STREAM MOBILE - Cartes", "ATAKAM - Salamanca", 
            "ATAKAM - Valladolid", "KONECTA - Sevilla", "BEMORE - Madrid", "SERVINFORM - Torrejón de Ardoz", 
            "GSS - Badajoz", "KONECTA - Córdoba", "Foundever Sevilla negocios", "Teleperformance Salamanca negocios", 
            "BOSCH Vigo negocios", "COMVERS Sevilla negocios", "FOUNDEVER Sevilla negocios", "JCP2CALL Málaga negocios", 
            "KONECTA Sevilla negocios", "TNT Lugo negocios"
        ],
        "MásMóvil": [
            "Central", "Stream Cantabria", "Konecta Córdoba Residencial", "Konecta Córdoba Negocios", 
            "Servinform Madrid Residencial", "Konecta Sevilla", "Marktel Madrid Negocios", "Serviform Valladolid Negocios", 
            "Servinform Madrid Negocios", "PERU", "NEKXUS COLOMBIA", "KONECTA LIMA"
        ],
        "Vodafone": [
            "Central", "KONECTA Sevilla", "KONECTA Valladolid", "MAJOREL Zaragoza", "TP Ponferrada", "KONECTA Sevilla (PIBO)", 
            "KONECTA Valladolid (Cartera)", "MARKTEL Albacete", "VPLAT Madrid", "VPLAT Valladolid", "Red chain", "Bonatel", 
            "Pablo Sánchez XXI", "Climent", "Eulogio (grupo teleoperator)", "Grupo Móvil", "Servitel XXI", "Ondas System SL", 
            "New Concept / vivacom", "Mederos", "TDC SENSITIA", "Despliegue de Oferta Central"
        ],
        "Euskaltel": [
            "Central", "IBERMATICA Donostia", "LANALDEN Bilbao", "LANALDEN Derio", "XUPERA Barakaldo", "KONECTA A Coruña", 
            "GSC A Coruña", "Eulen Gijón", "OSP Oviedo", "V3 Valladolid"
        ],
        "Fnac": [
            "Central", "Fnac Callao", "Fnac Goya", "Fnac Castellana", "Fnac La Gavia", "Fnac Plaza Río", "Fnac Parquesur", 
            "Fnac Plaza Norte 2", "Fnac Gran Plaza 2", "Fnac Oasiz", "Fnac Connect Universidad Europea", "Fnac Triangle", 
            "Fnac L'Illa", "Fnac Arenas", "Fnac Glòries", "Fnac La Maquinista", "Fnac Splau", "Fnac Girona", "Fnac San Agustín", 
            "Fnac Bonaire", "Fnac Salera", "Fnac Alicante", "Fnac Nueva Condomina", "Fnac Sevilla", "Fnac Torre Sevilla", 
            "Fnac Málaga", "Fnac Marbella", "Fnac Granada", "Fnac Bilbao", "Fnac Donostia", "Fnac La Morea", 
            "Fnac Connect Pamplona", "Fnac Principado", "Fnac A Coruña", "Fnac Vigo", "Fnac Plaza España", 
            "Fnac Puerto Venecia", "Fnac Río Shopping", "Fnac Mallorca"
        ],
        "Telefónica": [
            "Central", "Plataformas Colombia", "Plataforma Atento Santander", "Plataforma Atento Barcelona", 
            "Plataforma Atento Toledo", "Plataforma Eurocen La Coruña", "Plataforma Eurocen Zaragoza", 
            "Plataforma Eurocen Málaga", "Talleres flagship Aprende", "COMMCENTER", "PHONEMOVIL", 
            "PHONEMOVIL PYMES", "JOVITEL", "CATPHONE", "JESMON", "BERMA", "MOBILEPHONE", "COMPLUTEL", "Telyco"
        ]
    };

    const dispositivosMobiles = ["Redmi 15 Series", "Redmi 15C Series", "Redmi A5", "Redmi A7 Pro", "Redmi Note 15 Series", "Xiaomi 17 series", "Xiaomi 17T Series"];
    const dispositivosNoMobiles = ["Air Fryer Series", "Aire Acondicionado", "Cámaras de Vigilancia", "Frigorífico", "Lavadora", "Redmi Buds 8 Series", "Redmi Pad 2 9,7\"", "Redmi Pad 2 Pro Series", "Redmi Pad 2 Series", "Redmi Watch 5 Series", "Redmi Watch 6 Series", "Robot Vacuum", "Scooters", "TV A 2026 Series", "TV S 2026 Series", "Vacuum", "Xiaomi Band 10 Series", "Xiaomi Buds 5 Series", "Xiaomi Buds 6 Series", "Xiaomi Openwear Stereo Series", "Xiaomi Pad 8 Series", "Xiaomi Watch 5 Series", "Xiaomi Watch S4 Series", "Xiaomi Watch S5 Series"];

    const html = `
    <div class="report-module fade-in">
        <header class="section-header" style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-main); padding-bottom: 1.5rem;">
            <h2 style="font-size: 1.75rem; margin-bottom: 0.5rem;"><i data-lucide="edit-3" style="color: var(--xiaomi-orange); width: 28px; vertical-align: middle; margin-right: 10px;"></i> ${editData && editData.mode === 'edit' ? 'Editar Reporte' : (editData && editData.mode === 'duplicate' ? 'Duplicar Reporte' : 'Nuevo Reporte de Formación')}</h2>
            <p style="color:var(--text-medium); font-weight: 500;">Registra los detalles de tu última sesión de entrenamiento.</p>
        </header>

        <form id="trainingForm" class="glass-card report-form-card">
            <div id="adminArea" style="display: none; background: var(--xiaomi-orange-light); padding: 1.5rem; border-radius: var(--border-radius-md); margin-bottom: 2rem; border: 1px dashed var(--xiaomi-orange);">
                <h4 style="margin-top:0; color: var(--xiaomi-orange); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Panel de Administrador</h4>
                <div class="form-group" style="margin-bottom:0;">
                    <label class="form-label">Reportar como:</label>
                    <select id="trainer" name="trainer" class="form-control">
                        <option value="${currentUser}">${currentUser}</option>
                    </select>
                </div>
            </div>

            <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
                <div class="form-group">
                    <label class="form-label" for="fecha">Fecha de formación</label>
                    <input type="date" id="fecha" name="fecha" class="form-control" required value="${editData ? editData.fecha : ''}">
                </div>

                <div class="form-group">
                    <label class="form-label" for="metodologia">Metodología</label>
                    <select id="metodologia" name="metodologia" class="form-control" required>
                        <option value="" disabled ${!editData ? 'selected' : ''}>Selecciona...</option>
                        <option value="Backoffice" ${editData && editData.metodologia === 'Backoffice' ? 'selected' : ''}>Backoffice</option>
                        <option value="Classroom" ${editData && editData.metodologia === 'Classroom' ? 'selected' : ''}>Classroom</option>
                        <option value="Evento" ${editData && editData.metodologia === 'Evento' ? 'selected' : ''}>Evento</option>
                        <option value="Hospitality" ${editData && editData.metodologia === 'Hospitality' ? 'selected' : ''}>Hospitality</option>
                        <option value="Live" ${editData && editData.metodologia === 'Live' ? 'selected' : ''}>Live</option>
                        <option value="POS" ${editData && editData.metodologia === 'POS' ? 'selected' : ''}>POS</option>
                        <option value="Reunión Interna" ${editData && editData.metodologia === 'Reunión Interna' ? 'selected' : ''}>Reunión Interna</option>
                        <option value="Training Material" ${editData && editData.metodologia === 'Training Material' ? 'selected' : ''}>Training Material</option>
                        <option value="Viaje" ${editData && editData.metodologia === 'Viaje' ? 'selected' : ''}>Viaje</option>
                        <option value="Webinar" ${editData && editData.metodologia === 'Webinar' ? 'selected' : ''}>Webinar</option>
                    </select>
                </div>

                <div class="form-group" id="wrapperCuenta">
                    <label class="form-label" for="cuenta">Cuenta *</label>
                    <select id="cuenta" name="cuenta" class="form-control" required>
                        <option value="" disabled ${!editData ? 'selected' : ''}>Selecciona la cuenta...</option>
                        <option value="Evento Xiaomi" ${editData && editData.cuenta === 'Evento Xiaomi' ? 'selected' : ''}>Evento Xiaomi</option>
                        <option value="Internal Training" ${editData && editData.cuenta === 'Internal Training' ? 'selected' : ''}>Internal Training</option>
                        <option value="MediaMarkt" ${editData && editData.cuenta === 'MediaMarkt' ? 'selected' : ''}>MediaMarkt</option>
                        <option value="ECI" ${editData && editData.cuenta === 'ECI' ? 'selected' : ''}>ECI</option>
                        <option value="Carrefour" ${editData && editData.cuenta === 'Carrefour' ? 'selected' : ''}>Carrefour</option>
                        <option value="Alcampo" ${editData && editData.cuenta === 'Alcampo' ? 'selected' : ''}>Alcampo</option>
                        <option value="Orange" ${editData && editData.cuenta === 'Orange' ? 'selected' : ''}>Orange</option>
                        <option value="Vodafone" ${editData && editData.cuenta === 'Vodafone' ? 'selected' : ''}>Vodafone</option>
                        <option value="MásMóvil" ${editData && editData.cuenta === 'MásMóvil' ? 'selected' : ''}>MásMóvil</option>
                        <option value="Euskaltel" ${editData && editData.cuenta === 'Euskaltel' ? 'selected' : ''}>Euskaltel</option>
                        <option value="Fnac" ${editData && editData.cuenta === 'Fnac' ? 'selected' : ''}>Fnac</option>
                        <option value="MISTORES" ${editData && editData.cuenta === 'MISTORES' ? 'selected' : ''}>MISTORES</option>
                        <option value="Telefónica" ${editData && editData.cuenta === 'Telefónica' ? 'selected' : ''}>Telefónica</option>
                    </select>
                </div>

                <div class="form-group" id="distWrapper" style="display: none;">
                    <label class="form-label" for="distribuidor">Distribuidor / Tienda / Plataforma</label>
                    <select id="distribuidor" name="distribuidor" class="form-control"></select>
                </div>

                <div class="form-group" id="wrapperCiudad">
                    <label class="form-label" for="ciudad">Ciudad</label>
                    <select id="ciudad" name="ciudad" class="form-control" required placeholder="Escribe o selecciona ciudad..."></select>
                </div>

                <div class="form-group" id="wrapperProvincia">
                    <label class="form-label" for="provincia">Provincia</label>
                    <select id="provincia" name="provincia" class="form-control" required>
                        <option value="" disabled ${!editData ? 'selected' : ''}>Selecciona provincia...</option>
                        <option value="COLOMBIA" ${editData && editData.provincia === 'COLOMBIA' ? 'selected' : ''}>COLOMBIA</option>
                        <option value="EUROPA" ${editData && editData.provincia === 'EUROPA' ? 'selected' : ''}>EUROPA</option>
                        <option value="PORTUGAL" ${editData && editData.provincia === 'PORTUGAL' ? 'selected' : ''}>PORTUGAL</option>
                        <optgroup label="España">
                            <option value="Álava" ${editData && editData.provincia === 'Álava' ? 'selected' : ''}>Álava</option>
                            <option value="Albacete" ${editData && editData.provincia === 'Albacete' ? 'selected' : ''}>Albacete</option>
                            <option value="Alicante" ${editData && editData.provincia === 'Alicante' ? 'selected' : ''}>Alicante</option>
                            <option value="Almería" ${editData && editData.provincia === 'Almería' ? 'selected' : ''}>Almería</option>
                            <option value="Asturias" ${editData && editData.provincia === 'Asturias' ? 'selected' : ''}>Asturias</option>
                            <option value="Ávila" ${editData && editData.provincia === 'Ávila' ? 'selected' : ''}>Ávila</option>
                            <option value="Badajoz" ${editData && editData.provincia === 'Badajoz' ? 'selected' : ''}>Badajoz</option>
                            <option value="Baleares" ${editData && editData.provincia === 'Baleares' ? 'selected' : ''}>Baleares</option>
                            <option value="Barcelona" ${editData && editData.provincia === 'Barcelona' ? 'selected' : ''}>Barcelona</option>
                            <option value="Burgos" ${editData && editData.provincia === 'Burgos' ? 'selected' : ''}>Burgos</option>
                            <option value="Cáceres" ${editData && editData.provincia === 'Cáceres' ? 'selected' : ''}>Cáceres</option>
                            <option value="Cádiz" ${editData && editData.provincia === 'Cádiz' ? 'selected' : ''}>Cádiz</option>
                            <option value="Cantabria" ${editData && editData.provincia === 'Cantabria' ? 'selected' : ''}>Cantabria</option>
                            <option value="Castellón" ${editData && editData.provincia === 'Castellón' ? 'selected' : ''}>Castellón</option>
                            <option value="Ceuta" ${editData && editData.provincia === 'Ceuta' ? 'selected' : ''}>Ceuta</option>
                            <option value="Ciudad Real" ${editData && editData.provincia === 'Ciudad Real' ? 'selected' : ''}>Ciudad Real</option>
                            <option value="Córdoba" ${editData && editData.provincia === 'Córdoba' ? 'selected' : ''}>Córdoba</option>
                            <option value="Cuenca" ${editData && editData.provincia === 'Cuenca' ? 'selected' : ''}>Cuenca</option>
                            <option value="Gerona" ${editData && editData.provincia === 'Gerona' ? 'selected' : ''}>Gerona</option>
                            <option value="Granada" ${editData && editData.provincia === 'Granada' ? 'selected' : ''}>Granada</option>
                            <option value="Guadalajara" ${editData && editData.provincia === 'Guadalajara' ? 'selected' : ''}>Guadalajara</option>
                            <option value="Guipúzcoa" ${editData && editData.provincia === 'Guipúzcoa' ? 'selected' : ''}>Guipúzcoa</option>
                            <option value="Huelva" ${editData && editData.provincia === 'Huelva' ? 'selected' : ''}>Huelva</option>
                            <option value="Huesca" ${editData && editData.provincia === 'Huesca' ? 'selected' : ''}>Huesca</option>
                            <option value="Jaén" ${editData && editData.provincia === 'Jaén' ? 'selected' : ''}>Jaén</option>
                            <option value="La Coruña" ${editData && editData.provincia === 'La Coruña' ? 'selected' : ''}>La Coruña</option>
                            <option value="La Rioja" ${editData && editData.provincia === 'La Rioja' ? 'selected' : ''}>La Rioja</option>
                            <option value="Las Palmas" ${editData && editData.provincia === 'Las Palmas' ? 'selected' : ''}>Las Palmas</option>
                            <option value="León" ${editData && editData.provincia === 'León' ? 'selected' : ''}>León</option>
                            <option value="Lérida" ${editData && editData.provincia === 'Lérida' ? 'selected' : ''}>Lérida</option>
                            <option value="Lugo" ${editData && editData.provincia === 'Lugo' ? 'selected' : ''}>Lugo</option>
                            <option value="Madrid" ${editData && editData.provincia === 'Madrid' ? 'selected' : ''}>Madrid</option>
                            <option value="Málaga" ${editData && editData.provincia === 'Málaga' ? 'selected' : ''}>Málaga</option>
                            <option value="Melilla" ${editData && editData.provincia === 'Melilla' ? 'selected' : ''}>Melilla</option>
                            <option value="Murcia" ${editData && editData.provincia === 'Murcia' ? 'selected' : ''}>Murcia</option>
                            <option value="Navarra" ${editData && editData.provincia === 'Navarra' ? 'selected' : ''}>Navarra</option>
                            <option value="Orense" ${editData && editData.provincia === 'Orense' ? 'selected' : ''}>Orense</option>
                            <option value="Palencia" ${editData && editData.provincia === 'Palencia' ? 'selected' : ''}>Palencia</option>
                            <option value="Pontevedra" ${editData && editData.provincia === 'Pontevedra' ? 'selected' : ''}>Pontevedra</option>
                            <option value="Salamanca" ${editData && editData.provincia === 'Salamanca' ? 'selected' : ''}>Salamanca</option>
                            <option value="Santa Cruz de Tenerife" ${editData && editData.provincia === 'Santa Cruz de Tenerife' ? 'selected' : ''}>Santa Cruz de Tenerife</option>
                            <option value="Segovia" ${editData && editData.provincia === 'Segovia' ? 'selected' : ''}>Segovia</option>
                            <option value="Sevilla" ${editData && editData.provincia === 'Sevilla' ? 'selected' : ''}>Sevilla</option>
                            <option value="Soria" ${editData && editData.provincia === 'Soria' ? 'selected' : ''}>Soria</option>
                            <option value="Tarragona" ${editData && editData.provincia === 'Tarragona' ? 'selected' : ''}>Tarragona</option>
                            <option value="Teruel" ${editData && editData.provincia === 'Teruel' ? 'selected' : ''}>Teruel</option>
                            <option value="Toledo" ${editData && editData.provincia === 'Toledo' ? 'selected' : ''}>Toledo</option>
                            <option value="Valencia" ${editData && editData.provincia === 'Valencia' ? 'selected' : ''}>Valencia</option>
                            <option value="Valladolid" ${editData && editData.provincia === 'Valladolid' ? 'selected' : ''}>Valladolid</option>
                            <option value="Vizcaya" ${editData && editData.provincia === 'Vizcaya' ? 'selected' : ''}>Vizcaya</option>
                            <option value="Zamora" ${editData && editData.provincia === 'Zamora' ? 'selected' : ''}>Zamora</option>
                            <option value="Zaragoza" ${editData && editData.provincia === 'Zaragoza' ? 'selected' : ''}>Zaragoza</option>
                        </optgroup>
                    </select>
                </div>
            </div>

            <hr style="border: 0; border-top: 1px solid var(--border-main); margin: 2rem 0;">

            <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
                <div class="form-group" id="wrapperContenidos">
                    <label class="form-label" for="contenidos">Contenidos</label>
                    <select id="contenidos" name="contenidos" class="form-control" required>
                        <option value="" disabled ${!editData ? 'selected' : ''}>Selecciona contenido...</option>
                        <option value="Launch" ${editData && editData.contenidos === 'Launch' ? 'selected' : ''}>Launch</option>
                        <option value="On boarding" ${editData && editData.contenidos === 'On boarding' ? 'selected' : ''}>On boarding</option>
                        <option value="Reforce" ${editData && editData.contenidos === 'Reforce' ? 'selected' : ''}>Reforce</option>
                        <option value="Refresh" ${editData && editData.contenidos === 'Refresh' ? 'selected' : ''}>Refresh</option>
                    </select>
                </div>

                <div class="form-group" id="wrapperPerfil">
                    <label class="form-label" for="perfil">Perfil de asistentes</label>
                    <select id="perfil" name="perfil" class="form-control" required>
                        <option value="" disabled ${!editData ? 'selected' : ''}>Selecciona perfil...</option>
                        <option value="Cliente Final" ${editData && editData.perfil === 'Cliente Final' ? 'selected' : ''}>Cliente Final</option>
                        <option value="Interno" ${editData && editData.perfil === 'Interno' ? 'selected' : ''}>Interno</option>
                        <option value="Prensa" ${editData && editData.perfil === 'Prensa' ? 'selected' : ''}>Prensa</option>
                        <option value="Promotor" ${editData && editData.perfil === 'Promotor' ? 'selected' : ''}>Promotor</option>
                        <option value="Teleoperador" ${editData && editData.perfil === 'Teleoperador' ? 'selected' : ''}>Teleoperador</option>
                        <option value="Trainer" ${editData && editData.perfil === 'Trainer' ? 'selected' : ''}>Trainer</option>
                        <option value="Vendedor" ${editData && editData.perfil === 'Vendedor' ? 'selected' : ''}>Vendedor</option>
                    </select>
                </div>
            </div>

            <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
                <div class="form-group" id="wrapperSesiones">
                    <label class="form-label" for="sesiones">Nº Sesiones</label>
                    <input type="number" id="sesiones" name="sesiones" class="form-control" min="0" required value="${editData ? editData.sesiones : ''}" placeholder="0">
                </div>
                <div class="form-group" id="wrapperAlumnos">
                    <label class="form-label" for="alumnos">Nº Personas</label>
                    <input type="number" id="alumnos" name="alumnos" class="form-control" min="0" required value="${editData ? editData.alumnos : ''}" placeholder="0">
                </div>
                <div class="form-group" id="wrapperTiendas">
                    <label class="form-label" for="tiendas">Nº de Tiendas</label>
                    <input type="number" id="tiendas" name="tiendas" class="form-control" min="0" required value="${editData ? editData.tiendas : ''}" placeholder="0">
                </div>
                <div class="form-group" id="wrapperHoras">
                    <label class="form-label" for="duracion">Duración (Horas)</label>
                    <input type="number" id="duracion" name="duracion" class="form-control" step="0.25" min="0" required value="${editData ? editData.duracion : ''}" placeholder="0.00">
                </div>
            </div>

            <div class="form-group" style="margin-top: 1.5rem;">
                <label class="form-label">Dispositivos Xiaomi</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <select id="dispositivos" name="dispositivos" multiple placeholder="Móviles..."></select>
                    <select id="dispositivos_no_movil" name="dispositivos_no_movil" multiple placeholder="Ecosistema..."></select>
                </div>
            </div>

            <div class="form-group" style="margin-top: 1.5rem;">
                <label class="form-label" for="comentarios">Comentarios / Observaciones</label>
                <textarea id="comentarios" name="comentarios" class="form-control" style="min-height: 100px; resize: vertical;" placeholder="Cualquier detalle relevante...">${editData ? editData.comentarios : ''}</textarea>
            </div>

            <div class="form-group" style="margin-top: 1.5rem;">
                <label class="form-label" id="photoLabel">Fotos (0/20)</label>
                <div id="photoContainer" style="display: flex; gap: 15px; flex-wrap: wrap; margin-top: 10px;">
                    <div class="photo-upload-box" id="photoTrigger" style="width: 100px; height: 100px; border: 2px dashed var(--border-main); border-radius: var(--border-radius-md); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease;">
                        <i data-lucide="camera" style="width: 32px; height: 32px; color: var(--text-muted);"></i>
                        <span style="font-size: 0.65rem; color: var(--text-muted); margin-top: 8px; font-weight: 700;">Añadir</span>
                    </div>
                </div>
                <input type="file" id="photoInput" style="display: none;" accept="image/*,.heic,.heif" multiple>
                <input type="hidden" id="photoData" name="photoData">
            </div>

            <div style="margin-top: 3rem; display: flex; gap: 15px;">
                ${editData ? '<button type="button" id="btnCancel" class="btn-outline" style="flex:1; height: 55px; font-size: 1.1rem;">Cancelar</button>' : ''}
                <button type="submit" id="btnSubmit" class="btn-primary" style="flex: 2; height: 55px; font-size: 1.1rem; font-weight: 700;">
                    <i data-lucide="send" style="width: 20px;"></i> ${editData && editData.mode === 'edit' ? 'Guardar Cambios' : 'Enviar Reporte'}
                </button>
            </div>
        </form>
    </div>
    `;

    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    if(!editData) document.getElementById('fecha').valueAsDate = new Date();

    if (role === 'Admin') {
        document.getElementById('adminArea').style.display = 'block';
        api.getUsersList().then(res => {
            if(res.status === 'success') {
                const s = document.getElementById('trainer'); 
                if(s) {
                    s.innerHTML = '';
                    res.data.forEach(u => s.innerHTML += `<option value="${u.user || u}">${u.name || u}</option>`);
                    s.value = editData ? editData.trainer : currentUser;
                }
            }
        });
    }

    let tsTienda = null;
    const tsCue = new TomSelect("#cuenta", { 
        placeholder: "Busca cuenta...",
        sortField: { field: "text", direction: "asc" },
        dropdownParent: 'body'
    });

    const updateTiendas = (val) => {
        const dw = document.getElementById('distWrapper'), ds = document.getElementById('distribuidor');
        if(!dw || !ds) return;

        if (val === "Internal Training") {
            dw.style.display = 'none';
            if(tsTienda) { tsTienda.destroy(); tsTienda = null; }
            ds.innerHTML = "";
            return;
        }

        if(tsTienda) { tsTienda.destroy(); tsTienda = null; }
        
        if(distribuidores[val]) {
            dw.style.display = 'block'; 
            ds.innerHTML = '<option value="">Busca o selecciona tienda...</option>';
            distribuidores[val].forEach(d => {
                const opt = document.createElement('option');
                opt.value = d; opt.innerText = d;
                ds.appendChild(opt);
            });
            
            tsTienda = new TomSelect("#distribuidor", {
                create: true,
                placeholder: "Escribe para buscar o añadir...",
                sortField: { field: "text", direction: "asc" },
                dropdownParent: 'body'
            });

            if(editData && editData.distribuidor) {
                const cleanVal = editData.distribuidor.replace(/^\+ /, '');
                // Si no está en la lista (custom store), lo añadimos como opción primero para que TomSelect lo reconozca
                if (!distribuidores[val].includes(cleanVal)) {
                    tsTienda.addOption({ value: cleanVal, text: cleanVal });
                }
                tsTienda.setValue(cleanVal);
            }
        } else {
            dw.style.display = 'none';
        }
    };

    tsCue.on('change', (val) => updateTiendas(val));

    const tsCiudad = new TomSelect("#ciudad", { 
        create: true, 
        placeholder: "Escribe...",
        dropdownParent: 'body'
    });
    const tsM = new TomSelect("#dispositivos", { 
        plugins: ['remove_button'], 
        create: true, 
        placeholder: "Móviles...",
        dropdownParent: 'body',
        onItemAdd: function() {
            this.setTextboxValue('');
            this.refreshOptions();
        }
    });
    dispositivosMobiles.forEach(d => tsM.addOption({value:d, text:d}));
    const tsNM = new TomSelect("#dispositivos_no_movil", { 
        plugins: ['remove_button'], 
        create: true, 
        placeholder: "Ecosistema...",
        dropdownParent: 'body',
        onItemAdd: function() {
            this.setTextboxValue('');
            this.refreshOptions();
        }
    });
    dispositivosNoMobiles.forEach(d => tsNM.addOption({value:d, text:d}));

    api.getCitiesList().then(res => { 
        if(res.status==='success' && tsCiudad) {
             res.data.forEach(c => tsCiudad.addOption({value:c, text:c}));
             if(editData) tsCiudad.setValue(editData.ciudad);
        }
    });

    const met = document.getElementById('metodologia'), con = document.getElementById('contenidos'), 
          per = document.getElementById('perfil');
    
    met.onchange = () => {
        const triggers = ["Backoffice", "Training Material", "Viaje", "Reunión Interna"], isBlock = triggers.includes(met.value);
        if(tsCue) { isBlock ? tsCue.disable() : tsCue.enable(); }
        if(con) { con.disabled = isBlock; con.required = !isBlock; }
        if(per) { per.disabled = isBlock; per.required = !isBlock; }
        ['wrapperCuenta', 'wrapperContenidos', 'wrapperPerfil'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.style.opacity = isBlock ? "0.4" : "1";
        });
        if(isBlock && !isLoadingEdit) { 
            if(tsCue) tsCue.clear();
            if(con) con.value = ""; if(per) per.value = "";
            document.getElementById('distWrapper').style.display='none'; 
        }
    };

    if(editData) {
        if(editData.metodologia) met.onchange();
        if(editData.cuenta) {
            tsCue.setValue(editData.cuenta);
            updateTiendas(editData.cuenta);
        }
        if(editData.dispositivos) tsM.setValue(editData.dispositivos.split(',').map(s=>s.trim()));
        if(editData.dispositivos_no_movil) tsNM.setValue(editData.dispositivos_no_movil.split(',').map(s=>s.trim()));
    }

    // --- NUEVO COMPRESOR DE IMÁGENES PARA MÓVIL ---
    async function compressImage(file, maxWidth = 1200, quality = 0.7) {
        let fileToProcess = file;
        
        // Soporte para HEIC/HEIF (Apple)
        if (file.type === "image/heic" || file.type === "image/heif" || file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif")) {
            if (typeof heic2any !== 'undefined') {
                try {
                    const blob = await heic2any({
                        blob: file,
                        toType: "image/jpeg",
                        quality: 0.8
                    });
                    fileToProcess = Array.isArray(blob) ? blob[0] : blob;
                } catch (e) {
                    console.error("Error al convertir HEIC:", e);
                }
            }
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(fileToProcess);
            img.onload = () => {
                URL.revokeObjectURL(url);
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round(height * (maxWidth / width));
                        width = maxWidth;
                    }
                } else {
                    if (height > maxWidth) {
                        width = Math.round(width * (maxWidth / height));
                        height = maxWidth;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = (err) => {
                URL.revokeObjectURL(url);
                reject(new Error("Error al cargar la imagen para compresión"));
            };
            img.src = url;
        });
    }

    const photoInput = document.getElementById('photoInput');
    const photoTrigger = document.getElementById('photoTrigger');
    const photoContainer = document.getElementById('photoContainer');
    let photosArray = [];
    let existingPhotos = [];

    if (editData && editData.photoLinks) {
        existingPhotos = editData.photoLinks.split(/[\n,]+/).map(s => s.trim()).filter(s => s.startsWith('http'));
        setTimeout(renderPhotos, 100);
    }

    if(photoTrigger) photoTrigger.onclick = () => photoInput.click();

    photoInput.onchange = async (e) => {
        const files = e.target.files;
        if(photosArray.length + existingPhotos.length + files.length > 20) { 
            alert("Máximo 20 fotos en total."); 
            return; 
        }
        
        if(photoTrigger) photoTrigger.innerHTML = '<div class="loader" style="width:20px;height:20px;border-width:2px;border-color:var(--xiaomi-orange) transparent transparent;"></div>';
        
        for (let i = 0; i < files.length; i++) {
            try {
                const compressedBase64 = await compressImage(files[i]);
                photosArray.push({
                    name: files[i].name,
                    mimeType: files[i].type,
                    base64Data: compressedBase64
                });
                renderPhotos(); 
            } catch (err) {
                console.error("Error comprimiendo foto:", err);
            }
        }
        
        if(photoTrigger) photoTrigger.innerHTML = '<i data-lucide="camera" style="width: 32px; height: 32px; color: var(--text-muted);"></i><span style="font-size: 0.65rem; color: var(--text-muted); margin-top: 8px; font-weight: 700;">Añadir</span>';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        photoInput.value = "";
    };

    function renderPhotos() {
        const boxes = photoContainer.querySelectorAll('.photo-thumb-v9');
        boxes.forEach(b => b.remove());
        
        const total = photosArray.length + existingPhotos.length;
        const label = document.getElementById('photoLabel');
        if(label) label.innerText = `Fotos (${total}/20)`;

        // Viejas (existingPhotos) - Borde azul para distinguir
        existingPhotos.forEach((p, idx) => {
            const div = document.createElement('div');
            div.className = 'photo-thumb-v9 fade-in';
            const idMatch = p.match(/id=([^&]+)/) || p.match(/\/d\/([^/]+)/);
            const thumb = idMatch ? `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w200` : p;
            div.style.cssText = `width: 100px; height: 100px; border-radius: var(--border-radius-md); background: url(${thumb}) center/cover; position: relative; border: 2px solid #3b82f6; cursor:pointer;`;
            div.title = "Haz clic para ver en Drive";
            div.onclick = () => window.open(p, '_blank');
            div.innerHTML = `<button type="button" style="position: absolute; top: -10px; right: -10px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; z-index:10;">×</button>`;
            div.querySelector('button').onclick = (e) => { e.stopPropagation(); existingPhotos.splice(idx, 1); renderPhotos(); };
            photoContainer.insertBefore(div, photoTrigger);
        });

        // Nuevas (photosArray) - Borde naranja
        photosArray.forEach((p, idx) => {
            const div = document.createElement('div');
            div.className = 'photo-thumb-v9 fade-in';
            div.style.cssText = `width: 100px; height: 100px; border-radius: var(--border-radius-md); background: url(${p.base64Data}) center/cover; position: relative; border: 2px solid var(--xiaomi-orange);`;
            div.innerHTML = `<button type="button" style="position: absolute; top: -10px; right: -10px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; z-index:10;">×</button>`;
            div.querySelector('button').onclick = (e) => { e.stopPropagation(); photosArray.splice(idx, 1); renderPhotos(); };
            photoContainer.insertBefore(div, photoTrigger);
        });
        
        if(photoTrigger) photoTrigger.style.display = total >= 20 ? 'none' : 'flex';
    }

    const form = document.getElementById('trainingForm');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnSubmit');
        btn.disabled = true; btn.innerHTML = '<div class="loader" style="width:20px; height:20px; border-width:2px;"></div> Enviando...';

        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());
        data.trainer = (role === 'Admin') ? (document.getElementById('trainer').value || currentUser) : currentUser;
        data.existingPhotos = existingPhotos.join('\n');
        data.dispositivos = tsM.getValue().join(', ');
        data.dispositivos_no_movil = tsNM.getValue().join(', ');
        
        if (data.cuenta === "Internal Training") data.distribuidor = "";

        // Feedback de progreso
        if (photosArray.length > 0) {
            btn.innerHTML = `<div class="loader" style="width:20px; height:20px; border-width:2px;"></div> Preparando ${photosArray.length} fotos...`;
        } else {
            btn.innerHTML = '<div class="loader" style="width:20px; height:20px; border-width:2px;"></div> Enviando reporte...';
        }

        // Formateo exacto de las fotos para el backend V5.0
        const formattedPhotos = photosArray.map((photoObj, index) => ({
            base64Data: photoObj.base64Data, // Extraemos solo el texto base64
            name: photoObj.name || `foto_${index}.jpg`,
            mimeType: photoObj.mimeType || 'image/jpeg'
        }));

        try {
            const res = editData && editData.mode === 'edit'
                ? await api.updateReport({ data: data, rowIdx: editData.rowIdx, photos: formattedPhotos })
                : await api.saveReport(data, formattedPhotos);

            if(res.status === 'success') {
                showToast("¡Éxito!", (editData && editData.mode === 'edit') ? "Reporte actualizado." : "Reporte enviado correctamente.");
                navigate('#dashboard');
            } else {
                alert("Error: " + res.message);
                btn.disabled = false; btn.innerHTML = '<i data-lucide="send" style="width: 20px;"></i> ' + (editData && editData.mode === 'edit' ? 'Guardar Cambios' : 'Enviar Reporte');
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        } catch(err) {
            alert("Error de conexión.");
            btn.disabled = false; btn.innerHTML = '<i data-lucide="send" style="width: 20px;"></i> ' + (editData && editData.mode === 'edit' ? 'Guardar Cambios' : 'Enviar Reporte');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    };

    if(editData && document.getElementById('btnCancel')) {
        document.getElementById('btnCancel').onclick = () => navigate('#dashboard');
    }
}
window.renderReport = renderReport;