# Historical weather acquisition method

## Crop data and acquisition status

ICRISAT is the crop dataset for FarmSight XAI. The clean dataset contains 36,951 records, and 229 geocoded locations have been accepted for weather acquisition.

An Open-Meteo historical acquisition attempt completed downloads for 14 locations before quota blocking. Those downloads represent a partial attempt, not complete weather coverage.

CDS ERA5 is the selected consistent historical weather source for the research dataset. The CDS one-day pilot and the Chittoor full-span pilot are verified. Bulk CDS acquisition is still incomplete: the latest batch attempt is paused because the generated Colab cells need correction. The next task is to repair and test the resumable acquisition cell.

## Variables and temporal coverage

Acquire `t2m` (2-metre temperature) and `tp` (total precipitation) for 1966–2017 inclusive. Each full-span location must contain **455832 hourly timestamps**, covering 1966-01-01 00:00 UTC through 2017-12-31 23:00 UTC, including leap days.

Preserve and inspect the returned variable metadata and units before conversion or aggregation. Record any conversion or aggregation explicitly; do not assume that identically named quantities from different providers have identical units or temporal meaning.

CDS does not directly provide the ET0 variable used previously in this workflow. Do not substitute `tp`, rename another variable to ET0, or report ET0 as acquired from these requests. Any future ET0 derivation requires a documented method and its necessary inputs.

## ZIP and NetCDF validation

For each download, the acquisition workflow must validate the actual response format before treating the request as complete:

1. If the response is a ZIP archive, check archive integrity and identify its NetCDF members; a filename extension alone is insufficient evidence of valid data.
2. Open each relevant NetCDF file and check dimensions, variable names, metadata, and readable data. Confirm that both requested variables are present across the returned files.
3. Check the combined hourly time index against the full requested UTC period. Require 455832 unique, ordered timestamps for a full-span location, with no missing hours, duplicates, or out-of-range timestamps. A row count alone is insufficient.
4. Count missing values separately for `t2m` and `tp`, including encoded fill values. Record the counts and investigate gaps before accepting a location.
5. Retain the request parameters and validation results with the downloaded artifacts so that a resumed run can distinguish validated data from partial or failed downloads.

These are acceptance requirements for acquisition, not a claim that all locations have passed. The verified Chittoor 1966–2017 pilot contains 455,832 hourly timestamps, with 0 missing `t2m` values and 0 missing `tp` values.

## Time and spatial provenance

Use UTC timestamps throughout acquisition and validation. Preserve the timestamp convention when joining crop and weather data or aggregating hourly observations; document any later local-time conversion.

Record both requested location coordinates and the grid coordinates returned by ERA5. Returned grid coordinates can differ from the requested point; preserve that mapping rather than labeling grid data as exact point measurements. Retain the extraction method and spatial request parameters for reproducibility.

## Provider consistency and reproducibility

Do not mix the 14 Open-Meteo downloads with CDS ERA5 records in a combined research dataset without an explicit provider comparison. Such a comparison must address overlapping dates and locations, variables, units, temporal aggregation, grid selection, missingness, and systematic differences before a combination is justified.

Record actual request outcomes and validation evidence. Keep credentials outside notebooks, logs, and committed files. A submitted request or an existing output file does not establish a successful download. Do not report bulk acquisition, model training, evaluation, SHAP, or LIME as complete; these later stages remain outstanding.

The recorded notebook checkpoint is `6f7b317ecba5fbe2c2f2adeb17853152542ef8b6`. See [PROJECT_STATUS.md](PROJECT_STATUS.md) for the verified project status.
