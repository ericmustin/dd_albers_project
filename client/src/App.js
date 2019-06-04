import React, { Component } from "react";
import {
  ComposableMap,
  ZoomableGroup,
  Geographies,
  Geography,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import * as us_json from "./us_states.json";
import ReactTooltip from 'react-tooltip';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const mapStyles = {
  width: "75%",
  maxWidth: 980,
  margin: "0 auto",
  float: "left",
  display: "block",
  position: "relative"
}

const optionStyles = {
  width: "25%",
  maxWidth: 400,
  margin: "0 auto",
  float: "left",
  display: "block",
  position: "relative",
  textAlign: "center"
}

const buttonStyle = {
  color: "#333",
  borderRadius: "4px",
  textShadow: "0 1px 1px rgba(0, 0, 0, 0.2)",
  backgroundColor: "#eee",
  margin: "8px",
  minHeight: "36px",
  fontSize: "16px"
}

const options = [
  { value: 'avg', label: 'Average' },
  { value: 'sum', label: 'Sum' }
];

let colorScale = scaleLinear()
  .domain([10,100])
  .range(["#FFFFFF","#774aa4"])

const urlParams = new URLSearchParams(window.location.search);

let inputValue = ''

class AlbersUSA extends Component {
  constructor() {
    super()
    this.state = {
      logs_api_output: [],
      sorting_key: '',
      aggregation: '',
      query: ''
    }

    // deprecating in favor of react-select
    // this.switchToAvg = this.switchToAvg.bind(this)
    // this.switchToSum = this.switchToSum.bind(this)
    this.switchAggregation = this.switchAggregation.bind(this)
    this.submitQuery = this.submitQuery.bind(this)
    this.handleQueryChange = this.handleQueryChange.bind(this)
    this.switchStartDate = this.switchStartDate.bind(this)
    this.updateQuery = this.updateQuery.bind(this)
  }

  componentDidMount() {
    this.callBackendAPI().then(this.setResponse).catch(this.setError)
  }

  setResponse = (res) => {
    this.setState({ logs_api_output: res.logs || [], sorting_key: res.sorting_key || 'revenue', aggregation: res.aggregation || 'sum' , query: res.query || undefined , start_date: res.start_date || new Date()})
  }

  setError = (err) => {
    this.setState({ logs_api_output: [], sorting_key: '', aggregation: '', query: '', start_date: new Date() })
  }

  callBackendAPI = async () => {
    let params = ''
    
    if (this.state && this.state.query &&  Array.isArray(this.state.query)) {
      params += `query=${encodeURIComponent(this.state.query[0].value)}&sorting_key=${this.state.sorting_key}&aggregation=${this.state.aggregation}&start_date=${+this.state.start_date}`
    } else if (urlParams.get('config') !== undefined) {
      let myParam = urlParams.get('config')
      params += `config=${myParam}`
    }

    const response = await fetch(`/api?${params}`);
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message) 
    }

    return body;
  }

  updateQuery = () => {
    // console.log(this.state)
    this.callBackendAPI().then(this.setResponse).catch(this.setError)
  }

  switchAggregation(aggregation) {
    this.setState({ aggregation: aggregation.value})
  }

  handleQueryChange(query) {
    inputValue = query
  }  

  submitQuery(event) {
    // console.log('submit', event)
    if (event.key === "Enter") {
      // console.log('submitting', this.state.query)
      // console.log(inputValue)
      this.setState({query: [{value: inputValue,label: inputValue}]})
      event.preventDefault();
    }
    // this.setState({ query: aggregation.value})
  }

  switchStartDate(date) {
    this.setState({ start_date: date})
    // console.log(this.state.start_date, +this.state.start_date)
  }

  render() {
    // console.log('rerender')
    const logs_api_output = this.state.logs_api_output
    const sorting_key = this.state.sorting_key
    const aggregation = this.state.aggregation
    const query = this.state.query
    const start_date = this.state.start_date

    return (
      <div>
        <div style={optionStyles}>
          <div>
            <p> Aggregation Type </p>
            <Select
              value={aggregation.label}
              onChange={this.switchAggregation}
              options={options}
            />
          </div>
          <div>
            <p> Query </p>
            <CreatableSelect
              menuIsOpen={false}
              isClearable
              onInputChange={this.handleQueryChange}
              onKeyDown={this.submitQuery}
              // placeholder={`${query || "Type something and press enter..."}`}
              components={{DropdownIndicator: null}}
              value={query}
            />
          </div>
          <div>
            <p> Start Date </p>
            <DatePicker
                selected={start_date}
                onChange={this.switchStartDate}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                timeCaption="time"
            />          
          </div>
          <div>
            <button onClick={this.updateQuery} style={buttonStyle}> Update Map </button>
          </div>
        </div>
        <div style={mapStyles}>
          <ComposableMap
            projection="albersUsa"
            projectionConfig={{
              scale: 1000,
            }}
            width={980}
            height={551}
            style={{
              width: "100%",
              height: "auto",
            }}
            >
            <ZoomableGroup disablePanning>
              <Geographies geography={us_json.default} disableOptimization>
                {(geographies, projection) => {
                  
                  let max = Math.max.apply(null,logs_api_output.map( (x) => { return x.content.attributes[sorting_key] }))
                  if(max < 0) {
                    max = 0
                  }

                  colorScale = scaleLinear().domain([10,max]).range(["#FFFFFF","#774aa4"])

                  const sorted_logs_api_output = logs_api_output.reduce( (storage,log) => {
                    let name = log.content.attributes.state_name
                    if (storage[name] === undefined) {
                      storage[name] = {sum: 0, count: 0}
                    }
                    
                    storage[name]['sum'] = storage[name]['sum'] + log.content.attributes[sorting_key]
                    storage[name]['count'] = storage[name]['count'] + 1
                    return storage
                  },{})

                  return geographies.map((geography, i) => {
                    let stateRevenue = 0

                    if (sorted_logs_api_output[geography.properties.NAME_1] !== undefined) {
                      if (aggregation == 'avg') {
                        stateRevenue = sorted_logs_api_output[geography.properties.NAME_1]['sum'] /  sorted_logs_api_output[geography.properties.NAME_1]['count']
                      } else if (aggregation == 'sum') {
                        stateRevenue = sorted_logs_api_output[geography.properties.NAME_1]['sum']
                      }
                    }

                    return (
                      <Geography
                        data-tip={`${geography.properties.NAME_1}, revenue: $${stateRevenue}`}
                        data-for='global'
                        key={`state-${geography.properties.ID_1}`}
                        cacheId={`state-${geography.properties.ID_1}`}
                        round
                        geography={geography}
                        projection={projection}
                        style={{
                          default: {
                            fill: colorScale(+stateRevenue),
                            stroke: "#607D8B",
                            strokeWidth: 0.75,
                            outline: "none"
                          }
                        }}

                      />
                    )
                  })
                }}
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
          <ReactTooltip id='global'/>
        </div>
      </div>
    )
  }
}

export default AlbersUSA
