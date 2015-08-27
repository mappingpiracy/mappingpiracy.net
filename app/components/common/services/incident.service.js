(function() {
  'use strict';

  mp.service('IncidentService', IncidentService);

  IncidentService.$inject = ['$http', '$log', '$q', 'SheetRockService'];

  function IncidentService($http, $log, $q, SheetRockService) {

    var self = this;
    self.columnMap = {
      id: 'A',
      date_occurred: 'B',
      time_of_day: 'C',
      time_of_day_recode: 'D',
      incident_type: 'E',
      incident_action: 'F',
      territorial_water_status: 'G',
      closest_coastal_state: 'H',
      closest_coastal_state_cow_code: 'I',
      latitude: 'J',
      longitude: 'K',
      location_precision: 'L',
      geolocation_source_imb: 'M',
      geolocation_source_imo: 'N',
      geolocation_source_asam: 'O',
      location_description: 'P',
      vessel_name: 'Q',
      vessel_country: 'R',
      vessel_country_cow_code: 'S',
      vessel_status: 'T',
      violence_dummy: 'U',
      steaming_recode: 'V',
      incident_type_recode: 'W',
      incident_action_recode: 'X'
    };

    var service = {
      getIncidents: getIncidents,
      getDefaultIncidents: getDefaultIncidents,
      getYears: getYears,
      getCountries: getCountries,
      getTerritorialWaterStatuses: getTerritorialWaterStatuses,
      getVesselStatuses: getVesselStatuses,
      getIncidentTypes: getIncidentTypes,
      getIncidentActions: getIncidentActions,
      getDataSources: getDataSources,
      getGeolocationSources: getGeolocationSources,
      convertIncidentsToGeoJson: convertIncidentsToGeoJson
    };

    return service;

    function getDefaultIncidents(url) {
      var query = 'select id, latitude, longitude order by date_occurred desc';
      query = SheetRockService.renderQuery(self.columnMap, query);
      return SheetRockService.executeQuery(url, query, 100)
        .then(function(incidents) {
          incidents = sanitizeIncidents(incidents);
          incidents = convertIncidentsToGeoJson(incidents);
          return incidents;
        });
    }

    function getIncidents(url, filter, fields) {

      var where = [];
      if (angular.isUndefined(fields)) {
        fields = ['*'];
      }
      if (angular.isDefined(filter.id)) {
        where.push('id = ' + filter.id);
      }
      if (angular.isDefined(filter.beginDate) &&
        angular.isDefined(filter.endDate)) {
        where.push('date"' + filter.beginDate + '" > date_occurred');
        where.push('date"' + filter.endDate + '" < date_occurred');
      }


      if (angular.isDefined(filter.id)) {
        var query = 'select * where id = ' + filter.id;
        query = SheetRockService.renderQuery(self.columnMap, query);
      }
      return SheetRockService.executeQuery(url, query)
        .then(function(incidents) {
          incidents = sanitizeIncidents(incidents);
          incidents = convertIncidentsToGeoJson(incidents);
          return incidents;
        });
    }

    function sanitizeIncidents(incidents) {
      incidents.forEach(function(incident, index) {
        if (angular.isDefined(incident.date_occurred)) {
          incident.date_occurred = SheetRockService.convertdate_occurred(incident.date_occurred);
          incident.latitude = Number(incident.latitude);
          incident.longitude = Number(incident.longitude);
        }
      });
      return incidents;
    }

    function convertIncidentsToGeoJson(incidents) {
      var geojson = GeoJSON.parse(incidents, {
        Point: ['latitude', 'longitude']
      });
      return geojson;
    }

    function getYears(url) {
      var query = 'select count(id), year(date_occurred) where date_occurred is not null group by year(date_occurred) order by year(date_occurred) desc';
      query = SheetRockService.renderQuery(self.columnMap, query);
      return SheetRockService.executeQuery(url, query)
        .then(function(results) {
          return results.map(function(results) {
            return results['year(date_occurred)'];
          })
        });
    }

    function getCountries(url) {
      var countries = [],
        uniqueCountries = {},
        query = 'select closest_coastal_state, vessel_country where closest_coastal_state is not null and vessel_country is not null';
      query = SheetRockService.renderQuery(self.columnMap, query);
      return SheetRockService.executeQuery(url, query)
        .then(function(results) {
          results.forEach(function(result) {
            uniqueCountries[result.closest_coastal_state] = 1;
            uniqueCountries[result.vessel_country] = 1;
          });
          countries = Object.keys(uniqueCountries).sort();
          return countries;
        });
    }

    function getTerritorialWaterStatuses(url) {
      var query = 'select count(id), territorial_water_status where territorial_water_status is not null group by territorial_water_status order by territorial_water_status asc';
      query = SheetRockService.renderQuery(self.columnMap, query);
      return SheetRockService.executeQuery(url, query)
        .then(function(results) {
          return results.map(function(result) {
            return result.territorial_water_status;
          });
        });
    }

    function getVesselStatuses(url) {
      var query = 'select count(id), vessel_status where vessel_status is not null group by vessel_status order by vessel_status asc';
      query = SheetRockService.renderQuery(self.columnMap, query);
      return SheetRockService.executeQuery(url, query)
        .then(function(results) {
          return results.map(function(result) {
            return result.vessel_status;
          });
        })
    }

    function getIncidentTypes(url) {
      var query = 'select count(id), incident_type where incident_type is not null group by incident_type order by incident_type asc';
      query = SheetRockService.renderQuery(self.columnMap, query);
      return SheetRockService.executeQuery(url, query)
        .then(function(results) {
          return results.map(function(result) {
            return result.incident_type;
          });
        });
    }

    function getIncidentActions(url) {
      var query = 'select count(id), incident_action where incident_action is not null group by incident_action order by incident_action asc';
      query = SheetRockService.renderQuery(self.columnMap, query);
      return SheetRockService.executeQuery(url, query)
        .then(function(results) {
          return results.map(function(result) {
            return result.incident_action;
          });
        });
    }

    function getGeolocationSources(url) {
      var dfr = $q.defer();
      dfr.resolve(['IMB', 'IMO', 'ASAM']);
      return dfr.promise;
    }

    function getDataSources() {
      return $http.get('config/data-sources.json')
        .then(function(response) {
          self.dataSources = response.data;
          return self.dataSources;
        });
    }

  }

})();
