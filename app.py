#-*- coding: utf-8 -*-
# encoding=utf8
import json
import re
import requests
import simplejson
import sys
import time
import urllib

from legacy import config

reload(sys)
sys.setdefaultencoding('utf8')

gatherDataprovider = True
gather = True

key = config.api_key
#key = "api2demo"
api = "http://www.europeana.eu/api/v2/search.json?"
datasetName = config.collection


# TODO GET COLLECTION FROM PARAMS
collections 		= []
rows 			= 100

'''
http://www.europeana.eu/api/v2/search.json?wskey=BuKdAEBJo&query=edm_datasetName%3A15502_Ag_AT_Kulturpool_Khm%2A&rows=100&cursor=*
&query=edm_datasetName%3A15502_Ag_AT_Kulturpool_Khm%2A&rows=100&cursor=*
'''

# construction of search query
'''
query=*:*						Search all
&qf=RIGHTS:*creative*			Public Domain
&qf=TYPE:Video					video
&profile=portal+rich			Get all metadata fields
&qf=provider_aggregation_edm_isShownAt:*
'''



# query = "query=*:*&rows=" + str(rows) +  "&qf=RIGHTS:*creative*&qf=TYPE:Video&qf=provider_aggregation_edm_isShownBy:*&wskey=" + key +"&profile=portal+rich&qf="
query = "wskey=" + key + "&query=edm_datasetName%3A" +datasetName + "%2A&rows=" + str(rows)


ids = []

urlPattern = re.compile(
    r'^(?:http|ftp)s?://' # http:// or https://
    r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|' #domain...
    r'localhost|' #localhost...
    r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})' # ...or ip
    r'(?::\d+)?' # optional port
    r'(?:/?|[/?]\S+)$', re.IGNORECASE)


def getResults(url, cursor, total):
    results = []
    count = 0
    attempts = 12
    while cursor != False:

        try:
            start = time.time()
            result = requests.get(url + cursor)
            result.content
            roundtrip = time.time() - start
            if result.status_code != 200:
                if attempts > 1:
                    print "Did not receive proper response(" + str(result.status_code) + "), waiting for 5 seconds to try again"
                    time.sleep(5)
                    attempts = attempts - 1
                else:
                    print "Did not receive proper response(" + str(result.status_code) + ") over a minute. stopping querying..."
                    print "problematic query: " + url + cursor
                    return -1
            else:
                attempts = 12
                print 'processing: ' + str(count) + " of " + total + "(" + str(roundtrip) + ")..."
                result = result.json()
                if 'nextCursor' in result:
                    cursor = '&cursor=' + urllib.quote(result['nextCursor'], safe='')
                    count = count + 100
                else:
                    if count+100 > total:
                        print ("No new cursor found.", url + cursor)
                    else:
                        print ("No new cursor found. Natural end of query reached.")
                    cursor = False
                # print result
                results = results + processSet(result)

        except requests.ConnectionError, e:
            print ('Connection Error', unicode(url, 'utf-8') + cursor, str(sys.exc_info()[0]), str(e))
            return []
        except simplejson.scanner.JSONDecodeError, e:
            print ('Decoding Error', unicode(url, 'utf-8') + cursor, str(sys.exc_info()[0]), str(e))
            print 'Dumping result...'
            print str(result)
            return []
        except UnicodeDecodeError, e:
            print ('Encoding exception', unicode(url, 'utf-8') + cursor, str(sys.exc_info()[0]), str(e))
            return []

    return results

def getTotal(url):
    print "Getting total..."
    try:
        result = requests.get(url)
        result = result.json()
        return result['totalResults']
    except simplejson.scanner.JSONDecodeError, e:
        print ('Decoding Error', url, str(sys.exc_info()[0]), str(e))
        print 'Dumping result...'
        print str(result)
        return []
    except Exception, e:
        print ('Failed to retrieve total', url, str(sys.exc_info()[0]), str(e))
        print 'Dumping result...'
        print str(result)
        return []

def processSet(set):
    global urlPattern, ids
    results = []
    # title, description, rights_statement, media_type, credit, credit_url, source_url
    if 'items' in set:
        items = set['items']
        for item in items:
            # print item
            result = {}

            # if item['id'] in ids:
            #     print "double: http://www.europeana.eu/portal/record" + item['id'] + ".html"
            #     continue
            # else:
            #     ids.append(item['id'])
            #result['id'] = 'europeana_' + item['id'].replace('/','__')
            # ''' NO LINK TO INSTITUTION NECCESARY?

            result['institution_link'] = ""
            if 'edmIsShownAt' in item:
                if isinstance(item["edmIsShownAt"], (list, tuple)):
                    result['institution_link'] = item["edmIsShownAt"][0]
                else:
                    result['institution_link'] = item["edmIsShownAt"]
            # '''

            # if urlPattern.match(item['edmIsShownBy'][0]) is not None:
            #     result['source_url'] = item['edmIsShownBy'][0]
            # else:
            #     print 'missing url, skipping ' + item['id']
            #     continue
            # result['rights_statement'] = item['rights'][0]
            #result['source'] = "http://www.europeana.eu/portal/record" + item['id'] + ".html"

            result['title'] = ' | '.join(item["title"])
            result['credit'] = ""
            if 'dcCreator' in item:
                if isinstance(item["dcCreator"], (list, tuple)):
                    result['credit'] = ' | '.join(item["dcCreator"])
                else:
                    result['credit'] = item["dcCreator"]

            result['description'] = ""
            if 'dcDescription' in item:
                if isinstance(item["dcDescription"], (list, tuple)):
                    result['description'] = ' ß| '.join(item["dcDescription"])
                else:
                    result['description'] = item["dcDescription"]
            # results.append(result)
            results.append(item)
    return results
    # return items

# PROCESSING PART

data = []

print 'Starting Querying...'
total = str(getTotal(unicode(api+query, 'utf-8') + '&cursor=*'))
print "Total: " + total
data = data + getResults(api+query,'&cursor=*', total)
if data != []:
    print 'Query completed.'
print 'Trying to store Data...'
try:
    with open('output'+ config.collection+ '.json', 'w') as outfile:
        json.dump(data, outfile)
    outfile.close()
    print 'Data written to output.json'
except:
    print "ERROR: Storage of result failed."