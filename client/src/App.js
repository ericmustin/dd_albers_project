import React, { Component } from "react"
import {
  ComposableMap,
  ZoomableGroup,
  Geographies,
  Geography,
} from "react-simple-maps"
import { scaleLinear } from "d3-scale"
import * as us_json from "./us_states.json"

const wrapperStyles = {
  width: "100%",
  maxWidth: 980,
  margin: "0 auto",
}

let colorScale = scaleLinear()
  .domain([10,100])
  .range(["#FFFFFF","#774aa4"])

const urlParams = new URLSearchParams(window.location.search);

class AlbersUSA extends Component {
  constructor() {
    super()
    this.state = {
      logs_api_output: [],
      sorting_key: '',
      aggregation: ''
    }
  }
  componentWillMount() {
    this.callBackendAPI().then( (res) => {
      this.setState({ logs_api_output: res.logs, sorting_key: res.sorting_key || 'revenue', aggregation: res.aggregation || 'sum' })
    }).catch( (err) => {
      console.log('error', err)
      this.setState({ logs_api_output: [], sorting_key: '', aggregation: '' })
    })
  }

  callBackendAPI = async () => {
    const myParam = urlParams.get('config');    
    const response = await fetch(`/api?config=${myParam}`);
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message) 
    }

    return body;
  }

  render() {
    const logs_api_output = this.state.logs_api_output
    const sorting_key = this.state.sorting_key
    const aggregation = this.state.aggregation

    return (
      <div style={wrapperStyles}>
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
      </div>
    )
  }
}

export default AlbersUSA