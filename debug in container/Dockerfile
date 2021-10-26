FROM python:3.9 as base
WORKDIR /app
COPY ./requirements.txt ./requirements.txt
RUN pip3 install -r requirements.txt

##############
# unittest
##############

FROM base as unittest
CMD python -m unittest discover -s ./inclusion_exclusion/tests/

##############
# debugger-unittest
##############

FROM base as debugger-unittest
RUN pip3 install debugpy
CMD python -m debugpy --listen 0.0.0.0:5678 --wait-for-client -m unittest discover -s ./inclusion_exclusion/tests/

##############
# primary
##############

FROM base as primary
CMD python3 main.py