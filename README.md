# Setup

## Install HTTP Server (optional)
`$: npm install http-server -g`

## Run HTTP Server (optional)
`$: http-server -p 8083`

## Open
Nagivate in your browser to the following URL `http://localhost:8083/sandbox.html` or click [here](http://localhost:8083/sandbox.html)


# Data Model

We provide a template spreadsheet where you can plug-in your own data to display in the PolyCube.

## Data structure
The spreadsheet is seperated into different sections. We go over the sections and provide an explanation and example of values the properties can have.

### General Data

| -| - |
|----------------------|---|
| ID       | Number (Integer) - The objects identifier  |
| data_type          | Text - The data type of the object, __e.g., ''__  |
| title            | Text - The objects title, __e.g., ''__ |
| description | Text - A textual description of the object |
| media_url      | URL - The URL to the image, video, media resource, __e.g., ''__ |
| external_url      | URL - The URL to an external resource, __e.g., ''__ |
| comments      | Text - The users comments for the object  |

### Temporal Data

| -| - |
|----------------------|---|
| date_time        | Defines the temporal interval where the object is valid. The first argument is the start date and the second argument is the end date. If no end date is provided we assume its an ongoing relationship, __e.g., 2013-12-31T12:34:56 - 2014-12-31T12:34:56__  |
| date_time_uncert             | Number (Integer) - A number in the __range 0-100__   

### Categorical Data
| -| - |
|----------------------|---|
| category_1        | Text - User defined category, __e.g., 'Architectural Photographs'__  |
| category_2        | Text - User defined category, __e.g., 'Identification Photographs'__ |
| category_3        | Text - User defined category, __e.g., 'Cityscapes'__ |
| category_4        | Text - User defined category |
| category_5        | Text - User defined category |


### Geographical Data

| -| - |
|----------------------|---|
| location_name        | Text - The address of the location, __e.g., Opernring 2, 1010 Wien__  |
| latitude             | Number (Float) - Latitude of the locations, __e.g., 48.202760__  |
| longitude            | Number (Float) - Latitude of the locations, __e.g., 16.368798__  |
| location_granularity | Text (Predefined) - Selected from the dropdown menu, __e.g., 'City', 'Region', 'Country'__ |
| location_uncert      | Number (Integer) - A number in the __range 0-100__  |

### Relational Data

| -| - |
|----------------------|---|
| target        | Number - The ID of the target node that the current node (source) is related to  |
| directed             | Boolean - Defines of the relationship should be directed |
| label            | Text - The label that should appear on the relationship |
| range | Date - Defines the temporal interval where the relationship is valid. The first argument is the start date and the second argument is the end date. If no end date is provided we assume its an ongoing relationship, __e.g., 2013-12-31T12:34:56 - 2014-12-31T12:34:56__ |
