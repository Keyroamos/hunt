"""
WSGI config for House Hunt production deployment on cPanel.

This file is used by cPanel's Passenger to serve the Django application.
"""

import sys
import os

# Use PyMySQL as a drop-in replacement for MySQLdb
# This avoids the need to install mysqlclient which requires MySQL dev libraries
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass  # PyMySQL not installed, will fail later if MySQL is configured

# IMPORTANT: Update this path to match your cPanel username and project location
# IMPORTANT: Update this path to match your cPanel username
# Example: /home/your_username/public_html/hunthouse
CPANEL_USERNAME = 'your_cpanel_username' 
project_home = f'/home/{CPANEL_USERNAME}/public_html/hunthouse'

# Add your project directory to the sys.path
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Set the Django settings module
os.environ['DJANGO_SETTINGS_MODULE'] = 'househunt.settings_production'

# Activate the virtual environment
venv_path = os.path.join(project_home, 'venv')
activate_this = os.path.join(venv_path, 'bin', 'activate_this.py')

# For Python 3.x, we need to use exec instead of execfile
if os.path.exists(activate_this):
    with open(activate_this) as file_:
        exec(file_.read(), dict(__file__=activate_this))
else:
    # Alternative activation method
    import site
    site.addsitedir(os.path.join(venv_path, 'lib', f'python{sys.version_info.major}.{sys.version_info.minor}', 'site-packages'))

# Import the Django WSGI application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
