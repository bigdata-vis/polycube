import random
import json
from datetime import datetime
from collections import namedtuple
from pprint import pprint

with open('data/output15502_Ag_AT_Kulturpool_Khm.json') as json_data:
    data = json.load(json_data)


def data_clean_func(d):
    new_list = []

    for item in d[0:1]:
        pprint(item)

data_clean_func(data)

# # crime count function
# def count_types(nth, data_list):
#     count_obj = {}
#     for item in data_list:
#         if item[nth] in count_obj:
#             count_obj[item[nth]] = count_obj[item[nth]] + 1
#         else:
#             count_obj[item[nth]] = 1
#     return count_obj
#
# def data_clean_func(d):
#     new_list = []
#     crime_with_location = []
#     no_location_list = []
#     crime_type_list = []
#     crime_counts = {}
#
#     rows = d.split("\n")
#     last_value = len(rows) - 1
#
#     data_split = rows[1:last_value]
#     # data_split = rows[1:2]
#
#     for item in data_split:
#         rows_split = item.split(",")
#
#         crime_report_by = rows_split[2]
#         crime_long = rows_split[4]
#         crime_lat = rows_split[5]
#         crime_type = rows_split[9]
#         crime_outcome = rows_split[10]
#         crime_date = rows_split[1]
#
#         # Uncertainty Setting
#         # set uncertainty to < 0.5 if crime_outcome == ""
#         if crime_outcome == '':
#             rand_num = float(random.uniform(0.1, 0.3))
#         else:
#             rand_num = float(random.uniform(0.5, 1.0))
#
#         # set uncertainty value
#         uncert_val = float(format(rand_num, '.1f'))
#
#         # only float identified numbers
#         if crime_long != '':
#             crime_long = float(crime_long)
#             crime_lat = float(crime_lat)
#
#             crime_with_location.append([item])
#         else:
#             no_location_list.append([item])
#
#
#         crime = {'date': crime_date, 'reported_by': crime_report_by, 'long': crime_long, 'latitude': crime_lat,
#                  'type': crime_type, 'outcome': crime_outcome, 'uncert': uncert_val}
#         new_list.append(crime)
#
#         #crime count start
#
#         crime2 = [crime_date, crime_report_by, crime_long, crime_lat, crime_type, crime_outcome]
#         crime_type_list.append(crime2)
#
#     type_data = count_types(4, crime_type_list)
#
#     #crime count end
#
#     return {"data": new_list, "meta": type_data}
#
# cleaned_data = data_clean_func(data)
