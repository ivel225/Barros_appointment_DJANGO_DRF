from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api import PatientViewSet, DoctorViewSet, AppointmentViewSet

router = DefaultRouter()
router.register("patients", PatientViewSet, basename="patients")
router.register("doctors", DoctorViewSet, basename="doctors")
router.register("appointments", AppointmentViewSet, basename="appointments")

urlpatterns = [
    path("", include(router.urls)),
]
