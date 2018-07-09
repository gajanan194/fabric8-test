from behave import *
from src.stage import *
from unittest import *


@given(u'I have verified a booster\'s pipeline has completed')
def step_impl(context):
    print('Attempting to use query for running Pipeline...')
    global stage
    stage = Stage()


@when(u'I query a pipeline\'s stage endpoint')
def step_impl(context):
    global result
    result = stage.runTest('testing 1234567890')
    print('Result = {}'.format(result))


@then(u'I should see the deployed app running on stage')
def step_impl(context):
    global expected_result
    expected_result = 'Success'
    assert (expected_result == result)