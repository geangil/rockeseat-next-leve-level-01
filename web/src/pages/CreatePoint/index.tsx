import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';
import axios from 'axios';

import Dropzone from '../../components/Dropzone';

import './styles.css';
import logo from '../../assets/logo.svg';

import api from '../../services/api';

interface Item {
  id: number;
  title: string;
  image_url: string;
}

interface State {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
}

interface IBGEUFResponse {
  id: number;
  sigla: string;
}

interface IBGECityResponse {
  id: number;
  nome: string;
}

const CreatePoint = () => {
  const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);

  const [success, setSuccess] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  
  const [selectedState, setSelectedState] = useState<State>({} as State);
  const [selectedCity, setSelectedCity] = useState<City>({} as City);
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const [selectedFile, setSelectedFile] = useState<File>();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
  })

  const history = useHistory();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude} = position.coords;
      console.log(position.coords);
      setInitialPosition([latitude, longitude]);
    })
  }, []);

  useEffect(() => {
    setSelectedPosition(initialPosition);
  }, [initialPosition]);

  useEffect(() => {
    api.get('items').then(response => {
      setItems(response.data);
    });
  }, []);

  useEffect(() => {
    axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(response => {
        setStates(response.data.map(uf => ({
          id: uf.id,
          name: uf.sigla
        })));
    });
  }, []);

  useEffect(() => {
    if (!selectedState) {
      return;
    }
    axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState.id}/municipios?orderBy=nome`)
      .then(response => {
        setCities(response.data.map(city => ({
          id: city.id,
          name: city.nome
        })));
    });
  }, [selectedState]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = setTimeout(() => {
      history.push('/');
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [history, success]);

  function handleSelectState(event: ChangeEvent<HTMLSelectElement>) {
    const findState = states.find(state => state.id === Number(event.target.value));
    
    if (findState) {
      setSelectedState(findState);
    }
  }

  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    const findCity = cities.find(city => city.id === Number(event.target.value));

    if (findCity) {
      setSelectedCity(findCity);
    }
  }

  function handleMapClick(event: LeafletMouseEvent) {
    setSelectedPosition([
      event.latlng.lat,
      event.latlng.lng
    ]);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value, //[name] = para inserir o nome do campo
    });
  }

  function handleSelecteItem(id: number) {
    const alreadySelected = selectedItems.findIndex(item => item === id);

    if (alreadySelected >=0) {
      const filteredItems = selectedItems.filter(item => item !== id);

      setSelectedItems(filteredItems);
    } else {

      setSelectedItems([
        ...selectedItems, 
        id
      ]);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const { name, email, whatsapp } = formData;
    const uf = selectedState.name;
    const city = selectedCity.name;
    const [latitude, longitude] = selectedPosition;
    const items = selectedItems;
    const image = selectedFile;

    const data = new FormData();
    data.append('name', name);
    data.append('email', email);
    data.append('whatsapp', whatsapp);
    data.append('uf', uf);
    data.append('city', city);
    data.append('latitude', String(latitude));
    data.append('longitude', String(longitude));
    data.append('items', items.join(','));

    if (image) {
      data.append('image', image);
    }

    await api.post('points', data);

    setSuccess(true);    
  }

  return (
    <>
      <div id="page-create-point">
        <header>
          <img src={logo} alt="Ecoleta"/>

          <Link to="/">
            <FiArrowLeft />
            Voltar para home
          </Link>
        </header>

        <form onSubmit={handleSubmit}>
          <h1>Cadastro do <br /> ponto de coleta</h1>
          
          <Dropzone onFileUpload={setSelectedFile} />

          <fieldset>
            <legend>
              <h2>Dados</h2>
            </legend>

            <div className="field">
              <label htmlFor="name">Nome da entidade</label>
              <input
                type="text"
                name="name"
                id="name"
                onChange={handleInputChange}
              />
            </div>

            <div className="field-group">
              <div className="field">
                <label htmlFor="email">E-mail</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  onChange={handleInputChange}
                />
              </div>

              <div className="field">
                <label htmlFor="whatsapp">Whatsapp</label>
                <input
                  type="text"
                  name="whatsapp"
                  id="whatsapp"
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>
              <div className="legend">
                <h2>Endereço</h2>
                <span>Selecione o endereço no mapa</span>
              </div>
            </legend>

            <Map 
              center={initialPosition} 
              zoom={15}
              onClick={handleMapClick}>
              <TileLayer
                attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <Marker position={selectedPosition} />
            </Map>

            <div className="field-group">
              <div className="field">
                <label htmlFor="uf">Estado</label>
                <select name="uf" id="uf" value={selectedState?.id} onChange={handleSelectState}>
                  <option value="0">Selecione um estado</option>
                  {states.map(state => (
                    <option key={state.id} value={state.id}>{state.name}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="city">Cidade</label>
                <select name="city" id="city" value={selectedCity?.id} onChange={handleSelectCity}>
                  <option value="0">Selecione uma cidade</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>
              <div className="legend">
                <h2>Ítens de coleta</h2>
                <span>Selecione um ou mais ítens abaixo</span>
              </div>
            </legend>

            <ul className="items-grid">
              {items.map(item => (
                <li 
                  key={item.id} 
                  onClick={() => handleSelecteItem(item.id)}
                  className={selectedItems.includes(item.id) ? 'selected' : ''}
                >
                  <img src={item.image_url} alt="{item.title}"/>
                  <span>{item.title}</span>
                </li>
              ))}            
            </ul>
          </fieldset>
          
          <button>
            Cadastrar ponto de coleta
          </button>
        </form>
      </div>
      {success && (
        <div id='success'>
          <FiCheckCircle size={48} color='#34CB79' />
          <span>Cadastro realizado</span>
        </div>
      )}
      
    </>
  );
};

export default CreatePoint;