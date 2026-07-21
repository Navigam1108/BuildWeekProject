def keep_recent(records, cutoff):
    retained = []
    for record in records:
        if record.timestamp >= cutoff:
            retained.append(record)
    return retained


def expired_record_ids(records, cutoff):
    return [index for index, record in enumerate(records) if record.timestamp < cutoff]
