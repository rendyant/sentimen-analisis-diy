from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.opd import OPD
from app.schemas.user import OPDOut

router = APIRouter(prefix="/opd", tags=["opd"])


@router.get("", response_model=list[OPDOut])
def list_opd(db: Session = Depends(get_db)):
    return db.query(OPD).order_by(OPD.name).all()