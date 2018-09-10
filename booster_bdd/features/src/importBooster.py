import requests
import features.src.support.helpers as helpers
import re
import os

boosterImported = False


class ImportBooster(object):
    def importGithubRepo(self, gitRepo):

        ###############################################
        # Environment variables
        #
        # Note: Pipelines = https://forge.api.openshift.io/api/services/jenkins/pipelines
        # Tokens are stored in a form of "<access_token>;<refresh_token>(;<username>)"
        theToken = helpers.get_user_tokens().split(";")[0]
        projectName = os.getenv('PROJECT_NAME')
        pipeline = os.getenv('PIPELINE')
        spaceId = helpers.getSpaceID()
        authHeader = 'Bearer {}'.format(theToken)

        print('Starting test.....')

        ###############################################
        # Import the booster
        headers = {'Accept': 'application/json',
                   'Authorization': authHeader,
                   'X-App': 'osio',
                   'X-Git-Provider': 'GitHub',
                   'Content-Type': 'application/x-www-form-urlencoded'}
        data = {'gitRepository': gitRepo,
                'projectName': projectName,
                'pipeline': pipeline,
                'space': spaceId}

        forgeApi = os.getenv("FORGE_API")

        print('Making request to import...')

        try:
            r = requests.post(
                '{}/api/osio/import'.format(forgeApi),
                headers=headers,
                data=data
            )
            # print('request results = {}'.format(r.text))
            helpers.printToJson('Import booster request response', r)

            result = r.text
            global boosterImported
            if re.search('uuid', result):
                boosterImported = True
                return 'Success'
            else:
                boosterImported = False
                return 'Fail'
        
        except Exception as e:
            print('Unexpected booster import exception found: {}'.format(e))
            print('Raw text of request/response: [{}]'.format(r.text))
