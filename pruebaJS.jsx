import { useState, useEffect } from 'react';
import { Clock, CalendarDays, Plus, Trash2, RefreshCw } from 'lucide-react';

function classifyAttendances(concepts, attendanceIn, attendanceOut) {
  const respuesta = {};
  
  function horaExacta(hora) {
    if (!hora) return 0;
    const [h, m] = hora.split(':');
    return parseInt(h) + parseInt(m) / 60;
  }
  
  let entrada = horaExacta(attendanceIn);
  let salida = horaExacta(attendanceOut);
  
  if (salida < entrada) {
    salida += 24;
  }
  
  concepts.forEach(concepto => {
    const start = horaExacta(concepto.start);
    let end = horaExacta(concepto.end);
    
    if (end < start) {
      end += 24;
    }
    
    const iniciaHora = Math.max(entrada, start);
    const terminaHora = Math.min(salida, end);
    let horas = Math.max(0, terminaHora - iniciaHora);
    horas = Math.floor(horas * 2 + 0.5) / 2;
    
    respuesta[concepto.id] = horas;
  });
  
  return respuesta;
}

export default function AttendanceForm() {
  const [concepts, setConcepts] = useState([
    { id: 1, name: 'Horas Ordinarias', start: '07:00', end: '17:00' },
    { id: 2, name: 'Horas Extra', start: '17:00', end: '18:00' },
    { id: 2, name: 'Horas Extras Nocturnas', start: '18:00', end: '06:00' },
  ]);
  const [attendanceIn, setIngreso] = useState('07:30');
  const [attendanceOut, setSalida] = useState('18:30');
  const [resultados, setRespuestas] = useState({});
  const [apiData, setApiData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [notificacion, setNotificacion] = useState(null);

  const agregarConcepto = () => {
    const newId = concepts.length > 0 ? Math.max(...concepts.map(c => c.id)) + 1 : 1;
    setConcepts([...concepts, { id: newId, name: `Concepto ${newId}`, start: '00:00', end: '00:00' }]);
  };

  const borrarConcepto = (id) => {
    setConcepts(concepts.filter(concept => concept.id !== id));
  };

  const actualizarConcepto = (id, field, value) => {
    setConcepts(concepts.map(concept => 
      concept.id === id ? { ...concept, [field]: value } : concept
    ));
  };

  const calcResultados = () => {
    const calculatedresultados = classifyAttendances(concepts, attendanceIn, attendanceOut);
    setRespuestas(calculatedresultados);
    setNotificacion("Cálculo realizado con éxito");
    setTimeout(() => setNotificacion(null), 3000);
  };

  const fetchApiData = async () => {
    setCargando(true);
    setError(null);
    try {
      const response = await fetch('https://falconcloud.co/site_srv10_ph/site/api/qserv.php/13465-770721');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setApiData(data);
      setNotificacion("Datos obtenidos correctamente de la API");
      setTimeout(() => setNotificacion(null), 3000);
    } catch (error) {
      setError('Error al obtener datos de la API: ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    calcResultados();
  }, [concepts, attendanceIn, attendanceOut]);

  const getColor = (hours) => {
    if (hours === 0) return "bg-gray-100";
    if (hours < 4) return "bg-blue-100";
    if (hours < 8) return "bg-green-100";
    return "bg-purple-100";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-700">Sistema de Control de Asistencia</h1>
        <p className="text-gray-600 mt-2">Gestión y cálculo de horarios laborales</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-4">
          <CalendarDays className="mr-2 text-blue-600" size={24} />
          <h2 className="text-xl font-semibold text-blue-700">Registro de Horarios</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Entrada</label>
            <input
              type="time"
              value={attendanceIn}
              onChange={(e) => setIngreso(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Salida</label>
            <input
              type="time"
              value={attendanceOut}
              onChange={(e) => setSalida(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Clock className="mr-2 text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-blue-700">Configuración de Conceptos</h2>
          </div>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
            onClick={agregarConcepto}
          >
            <Plus size={16} className="mr-1" />
            Añadir Concepto
          </button>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          {concepts.map((concept) => (
            <div key={concept.id} className="bg-gray-50 rounded-md p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={concept.name}
                    onChange={(e) => actualizarConcepto(concept.id, 'name', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={concept.start}
                    onChange={(e) => actualizarConcepto(concept.id, 'start', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={concept.end}
                    onChange={(e) => actualizarConcepto(concept.id, 'end', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button 
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50"
                    onClick={() => borrarConcepto(concept.id)}
                    disabled={concepts.length <= 1}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md flex items-center justify-center transition-colors"
          onClick={calcResultados}
        >
          <RefreshCw size={18} className="mr-2" />
          Calcular Horas
        </button>
        
        {/* <button 
          className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-md flex items-center justify-center transition-colors disabled:opacity-50"
          onClick={fetchApiData}
          disabled={cargando}
        >
          {cargando ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-blue-600 mr-2"></div>
              Cargando...
            </div>
          ) : (
            <>
              <RefreshCw size={18} className="mr-2" />
              Actualizar Horas
            </>
          )}
        </button> */}
      </div>
      
      {notificacion && (
        <div className="fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md transition-opacity">
          {notificacion}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          {error}
        </div>
      )}
      
      {Object.keys(resultados).length > 0 && (
        <div className="bg-blue-50 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-blue-700 mb-4">Resultados del Cálculo:</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(resultados).map(([conceptId, hours]) => {
              const concept = concepts.find(c => c.id === parseInt(conceptId));
              return concept ? (
                <div key={conceptId} className={`${getColor(hours)} rounded-lg shadow p-4 transition-all hover:shadow-md`}>
                  <h3 className="font-bold text-gray-800 mb-1">{concept.name}</h3>
                  <div className="text-2xl font-bold text-center my-2 text-blue-800">{hours} horas</div>
                  <div className="text-sm text-gray-600 mt-2">
                    Horario: {concept.start} - {concept.end}
                  </div>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {apiData && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-blue-700 mb-4">Datos de la API:</h2>
          <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-64">
            <pre className="text-sm text-gray-800">
              {JSON.stringify(apiData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}