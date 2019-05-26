import React, { Component } from "react"
import {
  ComposableMap,
  ZoomableGroup,
  Geographies,
  Geography,
} from "react-simple-maps"
import { scaleLinear } from "d3-scale"
import * as example_api_output from "./example_api_output.json"
import * as us_json from "./us_states.json"

const wrapperStyles = {
  width: "100%",
  maxWidth: 980,
  margin: "0 auto",
}

const colorScale = scaleLinear()
  .domain([10,100])
  .range(["#FFFFFF","#FF5722"])

class AlbersUSA extends Component {
  constructor() {
    super()
    this.state = {
      logs_api_output: [],
    }
  }
  componentWillMount() {
    this.callBackendAPI().then( (res) => {
      console.log('resturned yo', res)
      this.setState({ logs_api_output: res.logs })
    }).catch( (err) => {
      console.log('error in componentWillMount', err)
      this.setState({ logs_api_output: [] })
    })
    
  }

  callBackendAPI = async () => {
    const response = await fetch('/api');
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message) 
    }

    return body;
  }

  render() {

    const { logs_api_output } = this.state

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
              {(geographies, projection) =>
                geographies.map((geography, i) => {
                  const stateRevenue = logs_api_output.find(s => {
                    return s.content.attributes.state_name === geography.properties.NAME_1
                  }) || {content: {attributes: {revenue: 0}}}
                  return (
                    <Geography
                      key={`state-${geography.properties.ID_1}`}
                      cacheId={`state-${geography.properties.ID_1}`}
                      round
                      geography={geography}
                      projection={projection}
                      style={{
                        default: {
                          fill: colorScale(+stateRevenue["content"]["attributes"]["revenue"]),
                          stroke: "#607D8B",
                          strokeWidth: 0.75,
                          outline: "none",
                        },
                        hover: {
                          fill: "#607D8B",
                          stroke: "#607D8B",
                          strokeWidth: 0.75,
                          outline: "none",
                        },
                        pressed: {
                          fill: "#FF5722",
                          stroke: "#607D8B",
                          strokeWidth: 0.75,
                          outline: "none",
                        },
                      }}
                    />
                  )
                }
              )}
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>
    )
  }
}

export default AlbersUSA